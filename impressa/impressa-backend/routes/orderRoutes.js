import express from "express";
import * as orderController from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { reportLimiter, analyticsLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Customer places an order
router.post("/", authMiddleware(["customer"]), orderController.placeOrder);

// Admin views all orders
router.get("/", authMiddleware(["admin"]), orderController.getAllOrders);

// Admin updates order status
router.put("/:id/status", authMiddleware(["admin"]), orderController.updateOrderStatus);

// Admin filtered view
router.get("/filter", authMiddleware(["admin"]), orderController.getFilteredOrders);

// Analytics
router.get("/report", authMiddleware(["admin"]), reportLimiter, orderController.generateReport);
router.get("/report/logs", authMiddleware(["admin"]), reportLimiter, orderController.getReportLogs);
router.get("/analytics", authMiddleware(["admin"]), analyticsLimiter, orderController.getOrderAnalytics);

router.post("/report/logs/:id/view", authMiddleware(["admin"]), orderController.markReportViewed);
router.post("/report/logs/:id/download", authMiddleware(["admin"]), orderController.markReportDownloaded);

export default router;