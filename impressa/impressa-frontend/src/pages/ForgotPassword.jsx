import { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [step, setStep] = useState("request");
  const [form, setForm] = useState({ email: "", token: "", newPassword: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/request-password-reset", {
        email: form.email,
      });
      setStep("confirm");
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/confirm-password-reset", {
        email: form.email,
        token: form.token,
        newPassword: form.newPassword,
      });
      alert("Password reset successful");
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-4 text-blue-600">Reset Your Password</h2>

        {step === "request" ? (
          <form onSubmit={handleRequest}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded"
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Send Reset Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <input
              type="text"
              name="token"
              placeholder="Enter reset code"
              value={form.token}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded"
              required
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded"
              required
            />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Confirm Reset
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;