import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaArrowLeft, FaGoogle } from "react-icons/fa";
import TrendingProductsSidebar from "../components/TrendingProductsSidebar";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mergeCart } = useCart();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    // Note: Google login via Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) setError(error.message);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await login(form.email, form.password);
      
      // Cart merging
      try { await mergeCart(); } catch (e) { console.error("Cart merge failed", e); }

      // Smart redirection based on role
      // Note: We might need to fetch the role from the backend if not in metadata
      const from = location.state?.from?.pathname;
      const role = localStorage.getItem('userRole') || 'customer';

      if (from) {
        navigate(from, { replace: true });
      } else if (role === "admin") {
        navigate("/admin");
      } else if (role === "seller") {
        navigate("/seller/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-charcoal-900 transition-colors duration-300">
      {/* Left Side - Trending Products */}
      <TrendingProductsSidebar />

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-charcoal-900 relative overflow-hidden">
        {/* Decorative background elements for dark mode */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/5 dark:bg-terracotta-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sand-500/5 dark:bg-sand-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-charcoal-500 dark:text-charcoal-400 font-bold hover:text-terracotta-500 dark:hover:text-terracotta-400 transition-colors group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="mx-auto w-full max-w-sm lg:w-96 relative z-10">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-4xl font-black text-charcoal-800 dark:text-white tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-charcoal-500 dark:text-charcoal-400 font-medium">
              Sign in to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-terracotta-50 dark:bg-terracotta-900/10 border-l-4 border-terracotta-500 rounded-r-2xl flex items-start gap-3 animate-head-shake">
              <FaShieldAlt className="text-terracotta-500 mt-1 shrink-0" />
              <p className="text-sm text-terracotta-700 dark:text-terracotta-400 font-bold leading-tight">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 ml-1">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400 group-focus-within:text-terracotta-500 transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-cream-100 dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-2xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all shadow-inner"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-charcoal-700 dark:text-charcoal-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400 group-focus-within:text-terracotta-500 transition-colors">
                  <FaLock />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-cream-100 dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-2xl text-charcoal-800 dark:text-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all shadow-inner"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-terracotta-500 focus:ring-terracotta-500 border-charcoal-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-bold text-charcoal-800 dark:text-charcoal-300 cursor-pointer">
                  Remember me
                </label>
              </div>

              <Link to="/forgot-password" size="sm" className="text-sm font-bold text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-terracotta-500 text-white rounded-2xl font-black text-lg hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-200 dark:shadow-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream-200 dark:border-charcoal-700"></div>
                </div>
                <div className="relative bg-white dark:bg-charcoal-900 px-4 inline-block">
                  <span className="text-sm font-bold text-charcoal-400 uppercase tracking-widest">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-2xl text-charcoal-700 dark:text-charcoal-300 font-bold hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-all active:scale-[0.98] shadow-sm"
              >
                <FaGoogle className="text-terracotta-500 text-lg" />
                Continue with Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-black text-terracotta-500 dark:text-terracotta-400 hover:text-terracotta-400 transition-colors">
                Create one now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;