import express from "express";
import * as cartController from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Optional auth middleware - if user is logged in, attach user to request
const optionalAuth = (req, res, next) => {
  // Try to authenticate, but don't fail if no token
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    return authMiddleware(["customer", "admin"])(req, res, next);
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
