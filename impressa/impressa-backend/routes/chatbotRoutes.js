import express from "express";
import { handlePublicChatbot, getChatLogs } from "../controllers/chatbotController.js";
import { authMiddleware, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route (optional auth to track user if logged in)
// We use a custom middleware wrapper or just handle req.user if it exists (assuming authMiddleware attaches it but doesn't block if not present? No, authMiddleware usually blocks).
// So we define a separate middleware or just leave it public. If the frontend sends the token, we want to parse it.
// For now, let's make it fully public.
router.post("/public", handlePublicChatbot);

// Admin route to view logs
router.get("/logs", authMiddleware(["admin"]), getChatLogs);

export default router;
