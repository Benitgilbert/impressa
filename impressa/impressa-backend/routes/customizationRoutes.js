import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit customization (customer only)
router.post(
  "/submit",
  authMiddleware(["customer"]),
  upload.single("customFile"), // accepts image or PDF
  async (req, res) => {
    try {
      const customization = {
        productId: req.body.productId,
        customText: req.body.customText || null,
        customFile: req.file ? req.file.filename : null,
        cloudLink: req.body.cloudLink || null,
        cloudPassword: req.body.cloudPassword || null,
        submittedBy: req.user.id,
      };
      // Save to DB (we'll create the model next)
      res.status(201).json(customization);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

export default router;