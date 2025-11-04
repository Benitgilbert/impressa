import cron from "node-cron";
import path from "path";
import fs from "fs";

import User from "../models/User.js";
import ReportLog from "../models/ReportLog.js";
import { buildReportData } from "../services/reportBuilders.js";
import { createimpressaPDF } from "../utils/pdfLayout.js";
import generateAISummary from "../utils/aiSummary.js";
import sendReportEmail from "../utils/sendReportEmail.js";

cron.schedule("0 8 1 * *", async () => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const admin = await User.findOne({ role: "admin" });
    if (!admin) return console.warn("No admin found for scheduled report");

    const { orders, summary } = await buildReportData("monthly", { month, year });
    const aiSummary = generateAISummary("monthly", summary);

    await ReportLog.create({
      type: "monthly",
      filters: { month, year },
      generatedBy: admin._id,
      format: "pdf",
      aiSummary,
    });

    const logoPath = path.join(path.resolve(), "assets/logo.png");
    const filePath = path.join(path.resolve(), `reports/monthly-${month}-${year}.pdf`);

    const doc = generateReportPDF(
      orders,
      summary,
      logoPath,
      {
        name: admin.name,
        title: admin.title || "impressa Administrator",
        signatureImage: admin.signatureImage,
        stampImage: admin.stampImage,
      },
      `Monthly Report - ${month}/${year}`
    );

    doc.pipe(fs.createWriteStream(filePath));
    doc.end();

    await sendReportEmail({
      to: admin.email,
      subject: `📊 Monthly Report - ${month}/${year}`,
      text: `Your monthly report is ready.\n\nSummary:\n${aiSummary}`,
      attachmentPath: filePath,
    });

    console.log(`✅ Monthly report generated: ${filePath}`);
  } catch (err) {
    console.error("❌ Scheduled report generation failed:", err);
  }
});