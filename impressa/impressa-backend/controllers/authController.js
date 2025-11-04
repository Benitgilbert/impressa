import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendReportEmail from "../utils/sendReportEmail.js";
import { renderTemplate } from "../utils/emailTemplate.js";

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 Determine role based on who is calling
    let assignedRole = "customer"; // default for public
    if (req.user && req.user.role === "admin") {
      // Admin can assign any valid role
      const allowedRoles = ["admin", "cashier", "inventory", "delivery", "customer", "guest"];
      assignedRole = allowedRoles.includes(role) ? role : "customer";
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No refresh token provided" });

    const payload = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Token expired or invalid" });
  }
};


export const adminLoginStep1 = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: "admin" });
  if (!user) return res.status(404).json({ message: "Admin not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;
  await user.save();

  const htmlContent = renderTemplate("otp-template", {
    otp: otp.split("").join(" "),
    email: user.email,
  });

await sendReportEmail({
  to: user.email,
  subject: "🔐 impressa Admin Login OTP",
  text: `Hello ${user.name},

Your impressa admin login code is: ${otp}

This code will expire in 20 minutes. Please do not share it with anyone.

If you did not request this login, you can safely ignore this message.

— impressa Security Team`,
  html: `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
        <div style="max-width: 480px; margin: auto; background: white; border-radius: 8px; padding: 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <h2 style="font-size: 22px; font-weight: 600; color: #333; margin-bottom: 12px;">Admin Login OTP</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
            Use this code to securely log in to impressa Admin.<br />
            This code will expire in <strong>20 minutes</strong>.
          </p>

          <!-- OTP Code -->
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin-bottom: 24px; color: #007BFF;">
            ${otp.toString().split("").join(" ")}
          </div>

          <!-- Info Text -->
          <p style="font-size: 14px; color: #666;">
            This code will securely log you in using:<br />
            <span style="color: #007BFF;">${user.email}</span>
          </p>

          <!-- Footer -->
          <p style="font-size: 12px; color: #aaa; margin-top: 32px;">
            If you didn’t request this email, you can safely ignore it.
          </p>
        </div>
      </body>
    </html>
  `
});

  res.json({ message: "OTP sent to admin email" });
};

// Admin login step 2: verify OTP
export const adminLoginStep2 = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, role: "admin" });
  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.json({
    token,
    user: { name: user.name, email: user.email, role: user.role },
  });
};

// Resend OTP
export const resendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user) return res.status(404).json({ message: "Admin not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendReportEmail({
  to: user.email,
  subject: "🔁 impressa Admin Login OTP (Resent)",
  html: `
    <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
      <div style="max-width: 480px; margin: auto; background: white; border-radius: 8px; padding: 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        
        <!-- Logo -->
        <div style="margin-bottom: 16px;">
          <img src="cid:impressa-logo" alt="impressa" style="height: 40px;" />
        </div>

        <!-- Header -->
        <h2 style="font-size: 22px; font-weight: 600; color: #333; margin-bottom: 12px;">Your New Admin Login Code</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
          This is your updated one-time login code for impressa Admin.<br />
          It will expire in <strong>20 minutes</strong>.
        </p>

        <!-- OTP Code -->
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin-bottom: 24px; color: #000;">
          ${otp.toString().split("").join(" ")}
        </div>

        <!-- Info Text -->
        <p style="font-size: 14px; color: #666;">
          This code will securely log you in using:<br />
          <span style="color: #007BFF;">${user.email}</span>
        </p>

        <!-- Footer -->
        <p style="font-size: 12px; color: #aaa; margin-top: 32px;">
          If you didn’t request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `,
  attachments: [
    {
      filename: "logo.png",
      path: "D:/Benit/prototype/impressa-backend/assets/logo.png",
      cid: "impressa-logo"
    }
  ]
});

    res.json({ message: "OTP resent to admin email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// Logout
export const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  res.json({ message: "Logged out successfully" });
};

// Admin creates user
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    await sendReportEmail({
      to: email,
      subject: "impressa Account Created",
      text: `Your temporary password is: ${tempPassword}`,
    });

    res.status(201).json({ message: "User created and email sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = resetToken;
  user.resetExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendReportEmail({
    to: email,
    subject: "impressa Password Reset",
    text: `Use this code to reset your password: ${resetToken}`,
  });

  res.json({ message: "Reset token sent to email" });
};

// Confirm password reset
export const confirmPasswordReset = async (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.resetToken !== token || Date.now() > user.resetExpires) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetExpires = null;
  await user.save();

  res.json({ message: "Password reset successful" });
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update user" });
  }
};