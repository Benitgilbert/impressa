import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import * as expenseController from "../controllers/expenseController.js";

const router = express.Router();

/**
 * All expense routes require authentication
 */
router.use(verifyToken);

router.post("/", expenseController.createExpense);
router.get("/", expenseController.getExpenses);
router.get("/:id", expenseController.getExpenseById);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", verifyAdmin, expenseController.deleteExpense);

export default router;
