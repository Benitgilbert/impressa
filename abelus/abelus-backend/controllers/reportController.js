import path from "path";
import fs from "fs";
import prisma from "../prisma.js";
import { buildReportData } from "../services/reportBuilders.js";
import { createabelusPDF } from "../utils/pdfLayout.js";
import convertToCSV from "../utils/csvExporter.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";

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

        // Build report data
        let orders, summary;
        try {
            const result = await buildReportData(type, filters);
            orders = result.orders;
            summary = result.summary;
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
            const csv = convertToCSV(orders);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${type}-report.csv`);
            return res.send(csv);
        }

        // Export as PDF
        const logoPath = path.join(path.resolve(), "assets/logo.png");
        let finalLogoPath = null;
        if (fs.existsSync(logoPath)) {
            finalLogoPath = logoPath;
        }

        const monthTitle = (filters.month && filters.year) 
            ? `Monthly Business Report – ${new Date(parseInt(filters.year), parseInt(filters.month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` 
            : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

        const doc = createabelusPDF({
            title: monthTitle,
            logoPath: finalLogoPath,
            signatory: {
                name: user.name,
                title: user.role === 'admin' ? "abelus Administrator" : "Store Manager / Seller",
                signatureImage: user.signatureImage,
                stampImage: user.stampImage,
            },
            contentBuilder: (doc, helpers) => {
                // Executive Summary
                doc.fillColor("#1E40AF").fontSize(10).font("Helvetica-Bold");
                doc.text("Executive Summary", { underline: true });
                doc.font("Helvetica").moveDown(0.2);
                doc.fillColor("#374151").fontSize(9);
                doc.text(aiSummary);
                doc.moveDown(0.8);

                // Key Metrics
                doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
                doc.text("Key Metrics", { underline: true });
                doc.font("Helvetica").moveDown(0.3);

                const metrics = Object.entries(summary).map(([k, v]) => [k, String(v)]);
                const startY = doc.y; 
                const leftX = doc.page.margins.left; 
                const rightX = doc.page.width / 2 + 10; 
                const lh = 12;

                metrics.forEach(([k, v], idx) => {
                    const col = idx % 2 === 0 ? 0 : 1;
                    const row = Math.floor(idx / 2);
                    const x = col === 0 ? leftX : rightX;
                    const y = startY + row * lh;
                    doc.fillColor('#374151').fontSize(9).text(`${k}: ${v}`, x, y, { width: rightX - leftX - 30, lineBreak: false });
                });

                const rowsUsed = Math.ceil(metrics.length / 2);
                doc.y = startY + rowsUsed * lh;
                doc.moveDown(0.6);

                // Order Details Table
                doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
                doc.text("Recent Orders in Report", { underline: true });
                doc.font("Helvetica").moveDown(0.3);

                const tableData = orders.slice(0, 30).map(o => ({
                    id: o.publicId || o.id.slice(-6).toUpperCase(),
                    customer: (o.customer?.name || o.customer?.email || "N/A").substring(0, 18),
                    total: `${o.grandTotal.toLocaleString()} Rwf`,
                    source: o.orderType === 'pos' ? "POS" : "Online",
                    status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
                    date: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })
                }));

                helpers.table({
                    columns: [
                        { key: "id", header: "ID", width: 60 },
                        { key: "customer", header: "Customer", width: 130 },
                        { key: "total", header: "Total", width: 90 },
                        { key: "source", header: "Source", width: 60 },
                        { key: "status", header: "Status", width: 70 },
                        { key: "date", header: "Date", width: 50 }
                    ],
                    rows: tableData
                });

                if (orders.length > 30) {
                    doc.moveDown(0.3);
                    doc.fillColor("#6B7280").fontSize(8).text(`Showing top 30 of ${orders.length} items. Download CSV for complete data.`, { align: "center" });
                }
            }
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

