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

        const doc = createabelusPDF({
            title: monthTitle,
            companyName: user.storeName || "abelus Custom Solutions",
            subtitle: user.title || `Performance Statement – Generated on ${new Date().toLocaleDateString()}`,
            contentBuilder: (pdfDoc, helpers) => {
                // Shift Context
                if (type === "daily" && filters.shifts && filters.shifts.length > 0) {
                    helpers.section("Shift Details");
                    filters.shifts.forEach((shift, idx) => {
                        const start = new Date(shift.startTime).toLocaleTimeString();
                        const end = shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : "STILL OPENED";
                        
                        pdfDoc.fontSize(10).fillColor("#374151").font("Helvetica-Bold")
                            .text(`Shift #${idx + 1}: ${start} - ${end}`);
                        
                        helpers.keyValue({
                            "Opening Cash": `RWF ${shift.startingDrawerAmount?.toLocaleString()}`,
                            "Closing/Current Cash": `RWF ${(shift.actualEndingDrawerAmount || shift.expectedEndingDrawerAmount)?.toLocaleString()}`,
                            "Status": shift.status.toUpperCase()
                        });
                        pdfDoc.moveDown(0.5);
                    });
                    pdfDoc.moveDown(0.5);
                }

                // Header Summary section
                helpers.section("Financial Summary");
                helpers.keyValue({
                    "Total Revenue": `RWF ${summary.totalRevenue?.toLocaleString()}`,
                    "Total Expenses": `RWF ${summary.totalExpenses?.toLocaleString()}`,
                    "Net Profit": `RWF ${summary.netProfit?.toLocaleString()}`,
                    "Physical Drawer": verificationAmount > 0 ? `RWF ${verificationAmount.toLocaleString()}` : "Not Verified",
                    "Difference": verificationAmount > 0 ? `${cashDiscrepancy >= 0 ? '+' : ''} RWF ${cashDiscrepancy.toLocaleString()}` : "N/A"
                });

                if (verificationAmount > 0 && Math.abs(cashDiscrepancy) > 0) {
                    pdfDoc.fontSize(8).fillColor(cashDiscrepancy < 0 ? "#DC2626" : "#059669").text(
                        `Note: There is a difference of ${Math.abs(cashDiscrepancy).toLocaleString()} Rwf between your physical drawer and recorded cash sales.`
                    );
                }

                pdfDoc.moveDown(1);
                
                // Detailed Transaction Table
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
                        { header: "Qty", key: "quantity", width: 30 },
                        { header: "P/U", key: "price", width: 60 },
                        { header: "Cash (Rwf)", key: "cashTotal", width: 80 },
                        { header: "Momo (Rwf)", key: "momoTotal", width: 80 }
                    ],
                    rows: flattenedItems.map(i => {
                        const isCash = i.paymentMethod.includes("cash");
                        return {
                            ...i,
                            price: i.price.toLocaleString(),
                            cashTotal: isCash ? i.subtotal.toLocaleString() : "0",
                            momoTotal: !isCash ? i.subtotal.toLocaleString() : "0"
                        }
                    })
                });

                // Total Row for Transaction Table
                pdfDoc.moveDown(0.2);
                pdfDoc.fontSize(9).font("Helvetica-Bold").fillColor("#374151")
                    .text(`TOTALS:  Cash: RWF ${summary.cashRevenue.toLocaleString()}  |  Momo: RWF ${summary.momoRevenue.toLocaleString()}`, { align: "right" });
                pdfDoc.fontSize(9).font("Helvetica-Bold").fillColor("#111827")
                    .text(`Total Transaction Value: RWF ${summary.totalRevenue.toLocaleString()}`, { align: "right" });

                pdfDoc.moveDown(1);

                // Expenses Table
                if (filters.expenses && filters.expenses.length > 0) {
                    helpers.section("Expenses Breakdown");
                    helpers.table({
                        columns: [
                            { header: "Description", key: "description", width: 180 },
                            { header: "Category", key: "category", width: 100 },
                            { header: "Date", key: "date", width: 100 },
                            { header: "Amount", key: "amount", width: 100 }
                        ],
                        rows: filters.expenses.map(e => ({
                            description: e.description,
                            category: e.category,
                            date: new Date(e.date).toLocaleDateString(),
                            amount: `RWF ${e.amount.toLocaleString()}`
                        }))
                    });
                    pdfDoc.moveDown(1);
                }
                
                // AI Insights
                helpers.section("Strategic AI Insights");
                pdfDoc.fillColor("#4B5563").fontSize(10).font("Helvetica-Oblique");
                pdfDoc.text(aiSummary, { lineGap: 4 });
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
