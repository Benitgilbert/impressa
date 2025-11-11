import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:identifier", categoryController.getCategoryByIdOrSlug);
router.get("/:identifier/products", categoryController.getProductsByCategory);

// Admin routes (protected)
router.post("/", verifyToken, verifyAdmin, categoryController.createCategory);
router.put("/:id", verifyToken, verifyAdmin, categoryController.updateCategory);
router.delete("/:id", verifyToken, verifyAdmin, categoryController.deleteCategory);
router.patch("/reorder", verifyToken, verifyAdmin, categoryController.reorderCategories);

export default router;
