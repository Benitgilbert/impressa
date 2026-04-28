import express from "express";
import {
  verifyToken,
  verifyAdmin,
} from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import { uploadProfileImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * Public Routes
 */
router.get("/team", authController.getTeamMembers);

/**
 * Authenticated User Routes
 */
router.get("/me", verifyToken, authController.getMe);
router.post("/complete-registration", verifyToken, authController.completeRegistration);
router.put(
  "/me",
  verifyToken,
  uploadProfileImage.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "storeLogo", maxCount: 1 },
  ]),
  authController.updateProfile
);

/**
 * Admin Routes
 */
router.get("/users", verifyAdmin, authController.getAllUsers);
router.post("/users", verifyAdmin, authController.createUser);
router.put("/users/:id", verifyAdmin, authController.updateUser);
router.delete("/users/:id", verifyAdmin, authController.deleteUser);

/**
 * Legacy / Stubbed Routes (prevent breakage)
 */
router.post("/register", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/login", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/refresh", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/admin/login-step1", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/admin/login-step2", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/request-password-reset", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));
router.post("/confirm-password-reset", (req, res) => res.status(410).json({ message: "Gone: Use Supabase Auth on frontend" }));

export default router;