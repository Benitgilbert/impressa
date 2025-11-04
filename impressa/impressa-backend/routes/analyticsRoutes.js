import express from "express";
import { 
  getRevenueData, 
  getWeeklyProfit, 
  getRecentOrders, 
  getCustomizationDemand,
  getTopProducts
} from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/revenue", authMiddleware(["admin"]), getRevenueData);
router.get("/weekly-profit", authMiddleware(["admin"]), getWeeklyProfit);
router.get("/recent-orders", authMiddleware(["admin"]), getRecentOrders);
router.get("/customization-demand", authMiddleware(["admin"]), getCustomizationDemand);
router.get("/top-products", authMiddleware(["admin"]), getTopProducts);

export default router;
