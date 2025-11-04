import express from "express";
import { register, login } from "../controllers/authController.js";
import {
  authMiddleware,
  verifyToken,
  verifyAdmin,
} from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/admin/users", verifyToken, verifyAdmin, register);
router.post("/login", login);
router.post("/refresh", authController.refreshToken);
router.post("/admin/resend-otp", authController.resendAdminOTP);

// Admin login with 2FA (OTP)
router.post("/admin/login-step1", authController.adminLoginStep1); // Step 1: verify password, send OTP
router.post("/admin/login-step2", authController.adminLoginStep2); // Step 2: verify OTP, issue token


router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/confirm-password-reset", authController.confirmPasswordReset);

router.get("/users", authController.getAllUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, authController.deleteUser);
router.put("/users/:id", verifyToken, verifyAdmin, authController.updateUser);

router.get("/admin/dashboard", authMiddleware(["admin"]), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role} user` });
});

export default router;