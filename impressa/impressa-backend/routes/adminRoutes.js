import express from "express";
import { verifyAdmin } from "../middleware/authMiddleware.js";
import { register } from "../controllers/authController.js";

const router = express.Router();

router.post("/users", verifyAdmin, register); // ✅ Only admins can create users

export default router;