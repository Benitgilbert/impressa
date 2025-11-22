import express from "express";
import jwt from "jsonwebtoken";
import * as cartController from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Optional auth middleware - if user is logged in, attach user to request
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
  } catch (err) {
    // Ignore invalid tokens, just don't authenticate the user
  }

  next();
};

// Public cart routes (works for both guests and authenticated users)
router.get("/", optionalAuth, cartController.getCart);
router.post("/items", optionalAuth, cartController.addToCart);
router.put("/items", optionalAuth, cartController.updateCartItem);
router.delete("/items/:productId", optionalAuth, cartController.removeFromCart);
router.delete("/", optionalAuth, cartController.clearCart);

// Coupon routes
router.post("/coupon", optionalAuth, cartController.applyCoupon);
router.delete("/coupon", optionalAuth, cartController.removeCoupon);

// Merge carts (requires authentication)
router.post("/merge", authMiddleware(["customer", "admin"]), cartController.mergeCarts);

export default router;
