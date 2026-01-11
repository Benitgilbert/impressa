import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/authController.js";
import {
  authMiddleware,
  verifyToken,
  verifyAdmin,
} from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";
import {
  validateRegister,
  validateLogin,
  validateAdminLoginStep1,
  validateAdminLoginStep2,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
  validateUpdateUser,
  validateResendOTP,
} from "../middleware/validation.js";
import { uploadProfileImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Generate JWT
    const accessToken = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: req.user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with tokens
    // Ideally, send via secure functionality or URL fragment
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${req.user.role}`);
  }
);

// Public routes with validation
router.get("/team", authController.getTeamMembers);
router.post("/register", validateRegister, register);
router.post("/admin/users", verifyToken, verifyAdmin, validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", authController.refreshToken);
router.post("/admin/resend-otp", validateResendOTP, authController.resendAdminOTP);

// Admin login with 2FA (OTP)
router.post("/admin/login-step1", validateAdminLoginStep1, authController.adminLoginStep1);
router.post("/admin/login-step2", validateAdminLoginStep2, authController.adminLoginStep2);

// Password reset routes
router.post("/request-password-reset", validatePasswordResetRequest, authController.requestPasswordReset);
router.post("/confirm-password-reset", validatePasswordResetConfirm, authController.confirmPasswordReset);

// User management routes
router.get("/users", authController.getAllUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, authController.deleteUser);
router.put("/users/:id", verifyToken, verifyAdmin, validateUpdateUser, authController.updateUser);

// User Profile Routes
router.get("/me", verifyToken, authController.getProfile);
router.put(
  "/me",
  verifyToken,
  uploadProfileImage.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "storeLogo", maxCount: 1 },
  ]),
  authController.updateProfile
);

router.get("/admin/dashboard", authMiddleware(["admin"]), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role} user` });
});

export default router;