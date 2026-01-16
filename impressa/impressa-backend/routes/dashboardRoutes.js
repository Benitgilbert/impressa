import express from "express";
import {
  getDashboardAnalytics,
  getForecast,
  getProductRecommendations,
  getAnomalies,
  handleChatbotQueryLLM // ✅ use only this
} from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/analytics", authMiddleware(["admin"]), getDashboardAnalytics);
router.get("/forecast", authMiddleware(["admin"]), getForecast);
router.get("/recommendations", authMiddleware(["admin"]), getProductRecommendations);
router.get("/anomalies", authMiddleware(["admin"]), getAnomalies);

router.post("/chatbot", authMiddleware(["admin", "seller"]), handleChatbotQueryLLM); // ✅ single chatbot route

export default router;