import express from "express";
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

const router = express.Router();

// Public routes with validation
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

router.get("/admin/dashboard", authMiddleware(["admin"]), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role} user` });
});

export default router;