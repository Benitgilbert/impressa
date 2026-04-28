import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaKey, FaArrowRight, FaArrowLeft, FaSpinner } from "react-icons/fa";
import TrendingProductsSidebar from "../components/TrendingProductsSidebar";

function ForgotPassword() {
  const [step, setStep] = useState("request");
  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSuccess("Reset link sent! Please check your email.");
    } catch (err) {
      console.error("Request failed:", err);
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Left Side - Trending Products Sidebar */}
      <TrendingProductsSidebar />

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-20 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-violet-100 dark:bg-violet-900/10 rounded-full blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 mb-12 transition-colors uppercase tracking-widest group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter">
              {step === "request" ? "Reset Password" : "Set New Password"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {step === "request"
                ? "Enter your email to receive a reset code."
                : "Enter the code sent to your email and your new password."}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 font-bold animate-shake">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <FaEnvelope className="text-sm" />
              </div>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <FaKey className="text-sm" />
              </div>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRequest}>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all font-bold"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-violet-600 text-white rounded-2xl font-black text-lg hover:bg-violet-700 transition-all active:scale-[0.98] shadow-lg shadow-violet-200 dark:shadow-none disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin text-2xl" /> : "Send Reset Link"}
              {!loading && <FaArrowRight />}
            </button>

            <div className="text-center mt-8">
              <Link to="/login" className="text-sm font-black text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors flex items-center justify-center gap-2">
                <FaArrowLeft className="text-xs" /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
