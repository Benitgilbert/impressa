import path from "path";
import fs from "fs";
import axios from "axios";
import prisma from "../prisma.js";
import { buildReportData } from "../services/reportBuilders.js";
import { createabelusPDF } from "../utils/pdfLayout.js";
import convertToCSV from "../utils/csvExporter.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";

/**
 * Helper to get logo as buffer for PDFKit
 */
const getLogoBuffer = async (logoUrlOrPath) => {
    try {
        if (!logoUrlOrPath) return null;

        // If it's a URL (Cloudinary)
        if (logoUrlOrPath.startsWith('http')) {
            const response = await axios.get(logoUrlOrPath, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        }

        // If it's a local path
        const fullPath = path.isAbsolute(logoUrlOrPath) ? logoUrlOrPath : path.join(path.resolve(), logoUrlOrPath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath);
        }
        return null;
    } catch (err) {
        console.warn("Failed to load logo buffer:", err.message);
        return null;
    }
};

/**
 * 📊 Generate and export business reports
 */
export const generateReport = async (req, res) => {
    try {
        const { type, format, ...filters } = req.query;
        const validTypes = ["monthly", "daily", "custom-range", "customer", "status", "revenue", "weekly"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: `Invalid report type. Must be one of: ${validTypes.join(", ")}` });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User profile not found." });

        // Enforce sellerId for sellers
        if (req.user.role === "seller") {
            filters.sellerId = req.user.id;
        }

        // Fetch site settings for logo
        const settings = await prisma.siteSettings.findFirst();

        // Build report data
        let orders, summary;
        try {
            const result = await buildReportData(type, filters);
            orders = result.orders;
            summary = result.summary;
            filters.expenses = result.expenses; 
            filters.shifts = result.shifts;
        } catch (buildError) {
            console.error("buildReportData error:", buildError);
            return res.status(500).json({ message: `Failed to build report data: ${buildError.message}` });
        }

        const aiSummary = generateAISummary(type, summary);

        // Log report generation
        await prisma.reportLog.create({
            data: {
                type,
                filters: filters || {},
                generatedById: user.id,
                format: format || 'pdf',
                aiSummary,
            }
        });

        // Async email sending
        try {
            await sendReportEmail({
                to: user.email,
                subject: `📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Report Ready`,
                text: `Your report has been generated.\n\nSummary:\n${aiSummary}`,
            });
        } catch (e) {
            console.warn("sendReportEmail failed:", e.message);
        }

        // Export as CSV
        if (format === "csv") {
            const csv = convertToCSV(orders, filters.expenses);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${type}-report.csv`);
            return res.send(csv);
        }

        // Export as PDF
        const logoBuffer = await getLogoBuffer(user.storeLogo || settings?.logo || "assets/logo.png");

        const monthTitle = (filters.month && filters.year) 
            ? `Monthly Business Report – ${new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` 
            : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

        const verificationAmount = Number(req.query.verificationAmount) || 0;
        const cashDiscrepancy = verificationAmount > 0 ? (verificationAmount - summary.cashRevenue) : 0;

        const performanceTitle = (filters.month && filters.year) 
            ? `Monthly Performance Statement` 
            : `Daily Performance Statement`;

        const doc = createabelusPDF({
            title: performanceTitle,
            companyName: "ABELUS",
            subtitle: "Custom Solutions",
            contentBuilder: (pdfDoc, helpers) => {
                // 1. Strategic AI Insights (Top)
                if (aiSummary) {
                    helpers.infoBox("Strategic AI Insights", aiSummary);
                }

                // 2. Financial Summary (Metric Cards)
                helpers.metricCards([
                    { label: "Total Revenue", value: `RWF ${summary.totalRevenue?.toLocaleString()}`, color: "#1E3A8A" },
                    { label: "Total Expenses", value: `RWF ${summary.totalExpenses?.toLocaleString()}`, color: "#1F2937" },
                    { label: "Net Profit", value: `RWF ${summary.netProfit?.toLocaleString()}`, color: "#059669" }
                ]);

                // 3. Discrepancy Note (Styled Alert)
                if (verificationAmount > 0) {
                    helpers.alert(
                        `There is a difference of ${Math.abs(cashDiscrepancy).toLocaleString()} RWF between your physical drawer (RWF ${verificationAmount.toLocaleString()}) and recorded cash sales.`,
                        cashDiscrepancy === 0 ? "success" : "warning"
                    );
                }

                // 4. Shift Activity Overview
                if (type === "daily" && filters.shifts && filters.shifts.length > 0) {
                    helpers.section("Shift Activity Overview");
                    helpers.table({
                        columns: [
                            { header: "Shift #", key: "index", width: 50 },
                            { header: "Period (Start - End)", key: "period", width: 170 },
                            { header: "Opening Cash", key: "opening", width: 100 },
                            { header: "Closing Cash", key: "closing", width: 100 },
                            { header: "Status", key: "status", width: 70, align: "center" }
                        ],
                        rows: filters.shifts.map((shift, idx) => ({
                            index: idx + 1,
                            period: `${new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "STILL OPEN"}`,
                            opening: `RWF ${shift.startingDrawerAmount?.toLocaleString()}`,
                            closing: `RWF ${(shift.actualEndingDrawerAmount || shift.expectedEndingDrawerAmount)?.toLocaleString()}`,
                            status: shift.status
                        }))
                    });
                }

                // 5. Transaction Detail
                helpers.section("Transaction Detail");
                const flattenedItems = orders.flatMap(o => o.items.map(i => ({
                    ...i,
                    orderDate: new Date(o.createdAt).toLocaleDateString(),
                    paymentMethod: (o.paymentMethod || "Cash").toLowerCase()
                })));

                helpers.table({
                    columns: [
                        { header: "Date", key: "orderDate", width: 60 },
                        { header: "Item Name", key: "productName", width: 140 },
                        { header: "Qty", key: "quantity", width: 30, align: "center" },
                        { header: "P/U", key: "price", width: 60, align: "right" },
                        { header: "Cash (RWF)", key: "cashTotal", width: 80, align: "right" },
                        { header: "Momo (RWF)", key: "momoTotal", width: 80, align: "right" }
                    ],
                    rows: flattenedItems.map(i => {
                        const isCash = i.paymentMethod.includes("cash");
                        return {
                            ...i,
                            price: i.price.toLocaleString(),
                            cashTotal: isCash ? i.subtotal.toLocaleString() : "0",
                            momoTotal: !isCash ? i.subtotal.toLocaleString() : "0"
                        }
                    }),
                    totals: {
                        price: "TOTALS",
                        cashTotal: `RWF ${summary.cashRevenue.toLocaleString()}`,
                        momoTotal: `RWF ${summary.momoRevenue.toLocaleString()}`
                    }
                });

                // 6. Expenses Breakdown
                if (filters.expenses && filters.expenses.length > 0) {
                    helpers.section("Expenses Breakdown");
                    helpers.table({
                        columns: [
                            { header: "Description", key: "description", width: 180 },
                            { header: "Category", key: "category", width: 100 },
                            { header: "Date", key: "date", width: 100 },
                            { header: "Amount", key: "amount", width: 100, align: "right" }
                        ],
                        rows: filters.expenses.map(e => ({
                            description: e.description,
                            category: e.category,
                            date: new Date(e.date).toLocaleDateString(),
                            amount: `RWF ${e.amount.toLocaleString()}`
                        }))
                    });
                }

                // 7. Approval & Authorization
                pdfDoc.moveDown(2);
                helpers.section("Approval & Authorization");
                pdfDoc.save().moveTo(pdfDoc.page.margins.left, pdfDoc.y).lineTo(pdfDoc.page.width - pdfDoc.page.margins.right, pdfDoc.y).strokeColor("#E2E8F0").lineWidth(0.5).stroke().restore();
                pdfDoc.moveDown(1);
                
                pdfDoc.fillColor("#1E293B").fontSize(10).font("Helvetica-Bold").text(`Prepared by: `, { lineBreak: false });
                pdfDoc.font("Helvetica").fillColor("#475569").text(user.name);
                
                pdfDoc.font("Helvetica-Bold").fillColor("#1E293B").text(`Title: `, { lineBreak: false });
                pdfDoc.font("Helvetica").fillColor("#475569").text(user.role?.toUpperCase() || "ADMIN");

                // Signature & Stamp Layout
                const sigAreaY = pdfDoc.y + 40;
                const leftM = pdfDoc.page.margins.left;
                const rightM = pdfDoc.page.width - pdfDoc.page.margins.right;

                // Signature Line
                pdfDoc.save().moveTo(leftM, sigAreaY).lineTo(leftM + 150, sigAreaY).strokeColor("#1E293B").lineWidth(1).stroke().restore();
                pdfDoc.fontSize(8).text("Signature", leftM, sigAreaY + 5);

                // Official Stamp Box (Dashed)
                const stampW = 100;
                const stampX = rightM - stampW;
                pdfDoc.save().rect(stampX, sigAreaY - 60, stampW, 60).dash(3, {space: 3}).strokeColor("#CBD5E1").stroke().restore();
                pdfDoc.fillColor("#94A3B8").fontSize(8).text("Official Stamp", stampX, sigAreaY - 30, { width: stampW, align: "center" });

                if (user.signatureImage) {
                    try { pdfDoc.image(user.signatureImage, leftM, sigAreaY - 45, { width: 100, height: 40 }); } catch (e) {}
                }
                if (user.stampImage) {
                    try { pdfDoc.image(user.stampImage, stampX + 10, sigAreaY - 55, { width: 80, height: 50 }); } catch (e) {}
                }
            },
            signatory: {
                name: user.name,
                title: user.role.toUpperCase(),
                signatureImage: user.signatureImage,
                stampImage: user.stampImage
            },
            logoPath: logoBuffer
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=${type}-report.pdf`);
        doc.pipe(res);
        doc.end();

    } catch (err) {
        console.error(`${req.query.type} report generation failed:`, err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate report." });
        }
    }
};
