import cron from "node-cron";
import path from "path";
import fs from "fs";

import prisma from "../prisma.js";
import { buildReportData } from "../services/reportBuilders.js";
import { createabelusPDF } from "../utils/pdfLayout.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";

/**
 * 📅 Scheduled Monthly Report Job
 * Runs on the 1st of each month at 8 AM
 */
cron.schedule("0 8 1 * *", async () => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!admin) return console.warn("No admin found for scheduled report");

    const { orders, summary } = await buildReportData("monthly", { month, year });
    const aiSummary = generateAISummary("monthly", summary);

    await prisma.reportLog.create({
      data: {
        type: "monthly",
        filters: { month, year },
        generatedById: admin.id,
        format: "pdf",
        aiSummary,
      }
    });

    const logoPath = path.join(path.resolve(), "assets/logo.png");
    const reportsDir = path.join(path.resolve(), "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filePath = path.join(reportsDir, `monthly-${month}-${year}.pdf`);

    const doc = createabelusPDF({
      title: `Monthly Report - ${month}/${year}`,
      logoPath,
      signatory: {
        name: admin.name,
        title: admin.title || "Abelus Administrator",
        signatureImage: admin.signatureImage,
        stampImage: admin.stampImage,
      },
      contentBuilder: (doc, helpers) => {
        // Executive summary
        doc.fillColor("#1E40AF").fontSize(10).font("Helvetica-Bold");
        doc.text("Executive Summary", { underline: true });
        doc.font("Helvetica").moveDown(0.2);
        doc.fillColor("#374151").fontSize(9);
        doc.text(aiSummary);
        doc.moveDown(0.8);

        // Key metrics
        doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
        doc.text("Key Metrics", { underline: true });
        doc.font("Helvetica").moveDown(0.3);

        doc.fillColor("#374151").fontSize(9);
        const summaryEntries = Object.entries(summary);
        const midpoint = Math.ceil(summaryEntries.length / 2);
        const leftColumn = summaryEntries.slice(0, midpoint);
        const rightColumn = summaryEntries.slice(midpoint);

        const startY = doc.y;
        const leftX = doc.page.margins.left;
        const rightX = doc.page.width / 2 + 10;
        const lineHeight = 12;

        leftColumn.forEach(([k, v], idx) => {
          const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          const val = typeof v === "number" ? v.toLocaleString() : String(v);
          doc.text(`${key}: ${val}`, leftX, startY + (idx * lineHeight), { width: rightX - leftX - 30, lineBreak: false });
        });
        rightColumn.forEach(([k, v], idx) => {
          const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          const val = typeof v === "number" ? v.toLocaleString() : String(v);
          doc.text(`${key}: ${val}`, rightX, startY + (idx * lineHeight), { width: rightX - 30, lineBreak: false });
        });

        const maxRows = Math.max(leftColumn.length, rightColumn.length);
        doc.y = startY + (maxRows * lineHeight);
        doc.moveDown(0.8);

        // Orders table
        doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
        doc.text("Order Details", { underline: true });
        doc.font("Helvetica").moveDown(0.3);

        const tableRows = orders.slice(0, 30).map(o => ({
          id: o.id.slice(-6).toUpperCase(),
          product: (o.items[0]?.product?.name || "N/A").substring(0, 22),
          customer: (o.customer?.name || o.customer?.email || "N/A").substring(0, 18),
          qty: String(o.items.reduce((sum, i) => sum + i.quantity, 0)),
          status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
          date: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        }));

        helpers.table({
          columns: [
            { key: "id", header: "ID", width: 50 },
            { key: "product", header: "Product", width: 130 },
            { key: "customer", header: "Customer", width: 110 },
            { key: "qty", header: "Qty", width: 35 },
            { key: "status", header: "Status", width: 70 },
            { key: "date", header: "Date", width: 60 }
          ],
          rows: tableRows
        });

        if (orders.length > 30) {
          doc.moveDown(0.3);
          doc.fillColor("#6B7280").fontSize(8);
          doc.text(`Showing 30 of ${orders.length} orders. Download CSV for complete report.`, { align: "center" });
        }
      }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();

    stream.on('finish', async () => {
        await sendReportEmail({
          to: admin.email,
          subject: `📊 Monthly Report - ${month}/${year}`,
          text: `Your monthly report is ready.\n\nSummary:\n${aiSummary}`,
          attachmentPath: filePath,
        });
        console.log(`✅ Monthly report generated and sent: ${filePath}`);
    });

  } catch (err) {
    console.error("❌ Scheduled report generation failed:", err);
  }
});