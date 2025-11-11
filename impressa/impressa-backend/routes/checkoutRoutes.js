import express from "express";
import * as checkoutController from "../controllers/checkoutController.js";

const router = express.Router();

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    const { authMiddleware } = require("../middleware/authMiddleware.js");
    return authMiddleware(["customer", "admin"])(req, res, next);
  }
  next();
};

// Checkout routes
router.post("/order", optionalAuth, checkoutController.createOrderFromCart);
router.post("/shipping/calculate", checkoutController.calculateShipping);
router.post("/tax/calculate", checkoutController.calculateTax);

export default router;
