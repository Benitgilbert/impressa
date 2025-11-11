import express from "express";
import * as orderController from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { reportLimiter, analyticsLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Customer places an order (supports file upload)
router.post("/", authMiddleware(["customer"]), upload.single("customFile"), orderController.placeOrder);

// Guest places an order (no auth)
router.post("/public", upload.single("customFile"), orderController.placeOrderGuest);

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

// Public order tracking
router.get("/track/:id", orderController.trackPublicOrder);

router.post("/report/logs/:id/view", authMiddleware(["admin"]), orderController.markReportViewed);
router.post("/report/logs/:id/download", authMiddleware(["admin"]), orderController.markReportDownloaded);

export default router;