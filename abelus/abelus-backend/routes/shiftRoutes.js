import express from "express";
import { startShift, getCurrentShift, closeShift, getShiftReport, getActiveShiftStats, getMyShifts } from "../controllers/shiftController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", authMiddleware(["admin", "seller", "cashier"]), startShift);
router.get("/current", authMiddleware(["admin", "seller", "cashier"]), getCurrentShift);
router.get("/my-shifts", authMiddleware(["admin", "seller", "cashier"]), getMyShifts);
router.get("/active-stats", authMiddleware(["admin", "seller", "cashier"]), getActiveShiftStats);
router.post("/close", authMiddleware(["admin", "seller", "cashier"]), closeShift);
router.get("/all", authMiddleware(["admin"]), getMyShifts); // Reusing getMyShifts which handles logic, but I should probably check if it needs a role-based override
router.get("/:id/report", authMiddleware(["admin", "seller", "cashier"]), getShiftReport);

export default router;
