import express from "express";
import path from "path";
import { createimpressaPDF } from "../utils/pdfLayout.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/generate", verifyAdmin, async (req, res) => {
  const { type, format } = req.query;

  if (type === "users" && format === "pdf") {
    try {
      const users = await User.find().select("name email role createdAt");

      const userRows = users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }));

      const contentBuilder = (doc, helpers) => {
        doc.fontSize(14).fillColor("#111827").font("Helvetica-Bold").text("User Table", { underline: true, align: "center" });
        doc.moveDown(0.6);

        helpers.table({
          columns: [
            { key: "name", header: "Name", width: 140 },
            { key: "email", header: "Email", width: 180 },
            { key: "role", header: "Role", width: 90 },
            { key: "createdAt", header: "Created At", width: 90 },
          ],
          rows: userRows.map(u => ({
            name: u.name || "",
            email: u.email || "",
            role: u.role || "",
            createdAt: new Date(u.createdAt).toLocaleDateString()
          }))
        });
      };

      const signatory = {
        name: "impressa Admin",
        title: "System Generated",
        signatureImage: null,
        stampImage: null,
      };

      const logoPath = path.join(path.resolve(), "assets/logo.png");

      const doc = createimpressaPDF({
        title: "User Table Report",
        contentBuilder,
        signatory,
        logoPath,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=user-table.pdf");
      doc.pipe(res);
      doc.end();
    } catch (err) {
      console.error("User table PDF export failed:", err.message);
      res.status(500).json({ message: "Failed to generate user table PDF" });
    }
  } else if (type === "users" && format === "csv") {
    try {
      const users = await User.find().select("name email role createdAt");
      const header = ["Name", "Email", "Role", "Created At"].join(",");
      const rows = users.map(u => [
        (u.name || "").replaceAll(",", " "),
        (u.email || "").replaceAll(",", " "),
        (u.role || "").replaceAll(",", " "),
        new Date(u.createdAt).toISOString()
      ].join(","));
      const csv = [header, ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users-report.csv");
      return res.status(200).send(csv);
    } catch (err) {
      console.error("User CSV export failed:", err.message);
      return res.status(500).json({ message: "Failed to generate user CSV" });
    }
  } else {
    res.status(404).json({ message: "Unsupported report type or format" });
  }
});

export default router;