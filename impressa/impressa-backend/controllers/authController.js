import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendReportEmail } from "../utils/sendReportEmail.js";
import { renderTemplate } from "../utils/emailTemplate.js";
import { processSellerAutoApproval } from "../utils/autoApproval.js";
import { notifyUserRegistered } from "./notificationController.js";

// Generate tokens
const generateTokens = (user) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET;

  if (!process.env.JWT_SECRET || !refreshSecret) {
    throw new Error("JWT_SECRET or REFRESH_SECRET is not defined in environment variables");
  }
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    refreshSecret,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, storeName, storeDescription, storePhone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Create user with seller profile if role is seller
    const userData = {
      name,
      email,
      password,
      role: role || "customer"
    };

    // Add seller-specific fields if registering as seller
    if (role === 'seller') {
      userData.storeName = storeName;
      userData.storeDescription = storeDescription;
      userData.storePhone = storePhone;
      userData.sellerStatus = 'pending';
    }

    const user = new User(userData);
    await user.save();

    // If registering as seller, check for auto-approval
    let approvalResult = null;
    if (role === 'seller') {
      approvalResult = await processSellerAutoApproval(user._id);
    }

    // 🔔 Notify Admin
    try {
      notifyUserRegistered(user.name, user.role);
    } catch (e) { }

    res.status(201).json({
      message: "User registered successfully",
      ...(approvalResult && {
        sellerApproval: {
          approved: approvalResult.approved,
          score: approvalResult.score,
          message: approvalResult.message
        }
      })
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token to DB (optional, for revocation)
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      },
    });
  } catch (err) {
    console.error("Login Error Details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Refresh token required" });

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET;
    const decoded = jwt.verify(token, refreshSecret);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
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

This code will expire in 5 minutes. Please do not share it with anyone.

If you did not request this login, you can safely ignore this message.

— impressa Security Team`,
    html: htmlContent
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

  // Clear OTP
  user.otp = null;
  user.otpExpires = null;

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
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

    const htmlContent = renderTemplate("otp-template", {
      otp: otp.split("").join(" "),
      email: user.email,
    });

    await sendReportEmail({
      to: user.email,
      subject: "🔁 impressa Admin Login OTP (Resent)",
      html: htmlContent
    });

    res.json({ message: "OTP resent to admin email" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// Request Password Reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const htmlContent = renderTemplate("otp-template", {
      otp: otp.split("").join(" "),
      email: user.email,
    });

    await sendReportEmail({
      to: user.email,
      subject: "🔑 impressa Password Reset Code",
      html: htmlContent
    });

    res.json({ message: "Password reset code sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Failed to send reset code" });
  }
};

// Confirm Password Reset
export const confirmPasswordReset = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== token || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken -otp -otpExpires");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken -otp -otpExpires");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password; // Will be hashed by pre-save hook

    // Seller Profile Updates
    if (req.body.storeName) user.storeName = req.body.storeName;
    if (req.body.storeDescription) user.storeDescription = req.body.storeDescription;
    if (req.body.storePhone) user.storePhone = req.body.storePhone;

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'profileImage') {
          user.profileImage = `/uploads/${file.filename}`;
        } else if (file.fieldname === 'storeLogo') {
          user.storeLogo = `/uploads/${file.filename}`;
        }
      });
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    // Fetch users with 'admin' role, excluding sensitive data
    const teamMembers = await User.find({ role: 'admin' }).select('name role profileImage');
    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp -otpExpires');
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};