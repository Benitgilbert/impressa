import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "cashier", "inventory", "delivery", "customer", "guest"],
    default: "customer",
  },
  signatureImage: { type: String, default: null },
  stampImage: { type: String, default: null },
  title: { type: String, trim: true },
  twoFactorEnabled: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  refreshToken: { type: String },
});

const User = mongoose.model("User", userSchema);
export default User;