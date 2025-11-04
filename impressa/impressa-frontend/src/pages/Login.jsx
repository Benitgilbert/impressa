import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // or use your axiosInstance

function Login() {
  const [step, setStep] = useState("credentials"); // 'credentials' or 'otp'
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/admin/login-step1", {
        email: form.email,
        password: form.password,
      });
      setStep("otp");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      alert("Invalid credentials or server error");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/admin/login-step2", {
        email: form.email,
        otp: form.otp,
      });
      const { token, user } = res.data;
      localStorage.setItem("authToken", token); // ✅ use destructured token

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "user") navigate("/dashboard");
      else navigate("/guest");
    } catch (err) {
      console.error("OTP verification failed:", err.response?.data || err.message);
      alert("Invalid or expired OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">impressa Admin Login</h2>

        {step === "credentials" ? (
          <>
            <form onSubmit={handleCredentialsSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full mb-3 px-4 py-2 border rounded"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full mb-3 px-4 py-2 border rounded"
                required
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Login & Send OTP
              </button>
            </form>
            <div className="text-center mt-4">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={form.otp}
              onChange={handleChange}
              className="w-full mb-3 px-4 py-2 border rounded"
              required
            />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Verify & Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;