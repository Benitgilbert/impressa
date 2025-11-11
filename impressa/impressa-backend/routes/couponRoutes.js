import express from "express";
import * as couponController from "../controllers/couponController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - validate coupon
router.post("/validate/:code", couponController.validateCoupon);

// Admin routes
router.get("/", verifyToken, verifyAdmin, couponController.getAllCoupons);
router.get("/:id", verifyToken, verifyAdmin, couponController.getCouponById);
router.get("/:id/stats", verifyToken, verifyAdmin, couponController.getCouponStats);
router.post("/", verifyToken, verifyAdmin, couponController.createCoupon);
router.put("/:id", verifyToken, verifyAdmin, couponController.updateCoupon);
router.delete("/:id", verifyToken, verifyAdmin, couponController.deleteCoupon);

export default router;
