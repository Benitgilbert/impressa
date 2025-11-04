import express from "express";
import * as productController from "../controllers/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Admin-only routes
router.post("/", authMiddleware(["admin"]), productController.createProduct);
router.put("/:id", authMiddleware(["admin"]), productController.updateProduct);
router.delete("/:id", authMiddleware(["admin"]), productController.deleteProduct);

export default router;