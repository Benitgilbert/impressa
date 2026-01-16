import express from "express";
import { handlePublicChatbot, getChatLogs, deleteChatLogs } from "../controllers/chatbotController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.post("/public", handlePublicChatbot);

// Admin routes
router.get("/logs", authMiddleware(["admin"]), getChatLogs);
router.delete("/logs", authMiddleware(["admin"]), deleteChatLogs);

export default router;
