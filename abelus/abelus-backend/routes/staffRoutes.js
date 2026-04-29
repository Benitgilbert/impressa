import express from "express";
import * as staffController from "../controllers/staffController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All staff routes are for sellers or admins
router.use(authMiddleware(["seller", "admin"]));

router.post("/", staffController.createStaff);
router.get("/", staffController.getStaff);
router.delete("/:id", staffController.deleteStaff);

export default router;
