import express from "express";
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

      const contentBuilder = (doc) => {
        doc.fontSize(14).text("User Table", { underline: true, align: "center" });
        doc.moveDown(0.5);

        const columns = [
          { label: "Name", x: 50 },
          { label: "Email", x: 200 },
          { label: "Role", x: 370 },
          { label: "Created At", x: 450 },
        ];

        doc.font("Helvetica-Bold").fontSize(10);
        const headerY = doc.y;
        columns.forEach(col => doc.text(col.label, col.x, headerY));
        doc.moveDown(0.5);

        doc.font("Helvetica").fontSize(10);
        userRows.forEach(user => {
          const y = doc.y;
          doc.text(user.name || "", columns[0].x, y);
          doc.text(user.email || "", columns[1].x, y);
          doc.text(user.role || "", columns[2].x, y);
          doc.text(new Date(user.createdAt).toLocaleDateString(), columns[3].x, y);
          doc.moveDown(0.5);
        });
      };

      const signatory = {
        name: "impressa Admin",
        title: "System Generated",
        signatureImage: null,
        stampImage: null,
      };

      const logoPath = "assets/logo.png";

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
  } else {
    res.status(404).json({ message: "Unsupported report type or format" });
  }
});

export default router;