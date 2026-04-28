import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { supabase } from "../utils/supabaseClient";
import {
    FaUser, FaEnvelope, FaLock, FaArrowRight, FaArrowLeft, FaStore, FaPhone,
    FaInfoCircle, FaGoogle, FaIdCard, FaBuilding, FaFileUpload,
    FaSignature, FaSpinner, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import TrendingProductsSidebar from "../components/TrendingProductsSidebar";

function Register() {
    const navigate = useNavigate();
    const [isSeller, setIsSeller] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [termsContent, setTermsContent] = useState("");
    const [termsScrolled, setTermsScrolled] = useState(false);
    const termsRef = useRef(null);

    const [formData, setFormData] = useState({
        // Account Info (Step 1)
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        // Store Info (Step 2 - Seller only)
        storeName: "",
        storeDescription: "",
        storePhone: "",
        // RDB Documents (Step 3 - Seller only)
        tinNumber: "",
        businessName: "",
        businessType: "sole_proprietor",
        rdbCertificate: null,
        nationalId: null,
        // Terms (Step 4 - Seller only)
        termsAccepted: false,
        digitalSignature: ""
    });

    const [fileNames, setFileNames] = useState({
        rdbCertificate: "",
        nationalId: ""
    });

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    // Fetch Terms & Conditions when seller mode is activated
    // Fetch Terms & Conditions when seller mode is activated
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const res = await fetch(`${API_URL}/seller-verification/terms`);
                const data = await res.json();
                if (data.success) {
                    setTermsContent(data.data.content);
                }
            } catch (err) {
                console.error("Failed to fetch terms");
            }
        };

        if (isSeller && !termsContent) {
            fetchTerms();
        }
    }, [isSeller, termsContent, API_URL]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            setFileNames(prev => ({ ...prev, [name]: files[0].name }));
        }
    };

    const handleTermsScroll = () => {
        if (termsRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setTermsScrolled(true);
            }
        }
    };

    const handleSellerToggle = (e) => {
        const checked = e.target.checked;
        setIsSeller(checked);
        if (!checked) {
            setStep(1); // Reset to step 1 if unchecking seller
            setTermsScrolled(false);
        }
    };

    // Validation for each step
    const validateStep = (stepNum) => {
        setError("");

        switch (stepNum) {
            case 1: // Account Info
                if (!formData.name.trim()) {
                    setError("Full name is required");
                    return false;
                }
                if (!formData.email.trim()) {
                    setError("Email is required");
                    return false;
                }
                if (!formData.password) {
                    setError("Password is required");
                    return false;
                }
                if (formData.password.length < 6) {
                    setError("Password must be at least 6 characters");
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    return false;
                }
                return true;

            case 2: // Store Info
                if (!formData.storeName.trim()) {
                    setError("Store name is required");
                    return false;
                }
                if (!formData.storePhone.trim()) {
                    setError("Store phone is required");
                    return false;
                }
                return true;

            case 3: // RDB Documents
                if (!formData.tinNumber.trim()) {
                    setError("TIN number is required");
                    return false;
                }
                const tinRegex = /^\d{9}$/;
                if (!tinRegex.test(formData.tinNumber.replace(/\s/g, ""))) {
                    setError("TIN must be exactly 9 digits");
                    return false;
                }
                if (!formData.businessName.trim()) {
                    setError("Registered business name is required");
                    return false;
                }
                if (!formData.rdbCertificate) {
                    setError("RDB certificate is required");
                    return false;
                }
                return true;

            case 4: // Terms & Signature
                if (!termsScrolled) {
                    setError("Please read the entire terms & conditions");
                    return false;
                }
                if (!formData.termsAccepted) {
                    setError("You must accept the terms & conditions");
                    return false;
                }
                if (!formData.digitalSignature.trim()) {
                    setError("Digital signature is required");
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) setError(error.message);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // For customers, just validate step 1
        if (!isSeller) {
            if (!validateStep(1)) return;
        } else {
            // For sellers, validate step 4
            if (!validateStep(4)) return;
        }

        setLoading(true);
        try {
            // Step 1: Register with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        role: isSeller ? "seller" : "customer"
                    }
                }
            });

            if (authError) throw authError;

            if (isSeller) {
                // If Supabase didn't auto-login (e.g. email confirmation required), we might need to sign in
                // But usually, with default settings, it might auto-login.
                // We'll use the session from signUp if available.
                const token = authData.session?.access_token;
                
                if (!token) {
                    // If no token, maybe email confirmation is needed
                    setError("Registration successful! Please check your email to confirm your account before completing your seller application.");
                    setLoading(false);
                    return;
                }

                // Step 2: Submit seller verification with RDB documents
                const sellerData = new FormData();
                sellerData.append("storeName", formData.storeName);
                sellerData.append("storeDescription", formData.storeDescription);
                sellerData.append("storePhone", formData.storePhone);
                sellerData.append("tinNumber", formData.tinNumber);
                sellerData.append("businessName", formData.businessName);
                sellerData.append("businessType", formData.businessType);
                sellerData.append("termsAccepted", formData.termsAccepted);
                sellerData.append("digitalSignature", formData.digitalSignature);
                sellerData.append("rdbCertificate", formData.rdbCertificate);
                if (formData.nationalId) {
                    sellerData.append("nationalId", formData.nationalId);
                }

                // Note: api (axiosInstance) will automatically attach the token if we use it correctly
                // or we can pass it in headers to be sure
                await api.post("/seller-verification/apply", sellerData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });

                setSuccess(true);
            } else {
                // Customer registration successful
                alert("Registration successful! Please check your email if confirmation is required, then login.");
                navigate("/login");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // Success screen for sellers
    if (success) {
        return (
            <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
                <TrendingProductsSidebar />
                <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-slate-950 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="mx-auto w-full max-w-sm lg:w-[32rem] relative z-10">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-500/20 rounded-[40px] p-8 md:p-12 text-center animate-fade-in-up">
                            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200/50 dark:shadow-none border-2 border-emerald-500">
                                <FaCheckCircle className="text-5xl text-emerald-500" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Application Submitted!</h2>
                            <p className="text-lg text-emerald-800 dark:text-emerald-400 font-bold mb-8">Your seller application has been received and is currently under review.</p>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 mb-10 text-left space-y-4 border border-emerald-100 dark:border-emerald-900/30">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 pb-3">What happens next?</h3>
                                <ul className="space-y-4 font-bold text-gray-700 dark:text-gray-300">
                                    <li className="flex gap-3 items-center"><span className="text-emerald-500">✅</span> Documents under review (1-3 days)</li>
                                    <li className="flex gap-3 items-center"><span className="text-emerald-500">📧</span> Email notification when approved</li>
                                    <li className="flex gap-3 items-center"><span className="text-emerald-500">🏪</span> Instant access to dashboard</li>
                                </ul>
                            </div>

                            <button
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-3"
                                onClick={() => navigate("/login")}
                            >
                                Go to Login <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }




    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
            <TrendingProductsSidebar />

            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-slate-950 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <Link
                    to="/"
                    className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="mx-auto w-full max-w-sm lg:w-[32rem] relative z-10 transition-all duration-500">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            {isSeller ? (
                                step === 1 ? "Create Account" :
                                    step === 2 ? "Store Information" :
                                        step === 3 ? "RDB Documents" :
                                            "Terms & Conditions"
                            ) : "Create Account"}
                        </h2>
                        {isSeller && (
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-600 transition-all duration-500"
                                        style={{ width: `${(step / 4) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-black text-violet-600 dark:text-violet-400 tracking-widest uppercase">Step {step}/4</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Steps for Seller - Mini versions */}
                    {isSeller && (
                        <div className="flex items-center justify-between mb-12 px-2">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex flex-col items-center gap-2 group flex-1 relative">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${step === s ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none scale-110" :
                                        step > s ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                                        }`}>
                                        {step > s ? <FaCheckCircle className="text-xl" /> : s}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${step === s ? "text-violet-600 dark:text-violet-400" :
                                        step > s ? "text-emerald-500" : "text-gray-400"
                                        }`}>
                                        {s === 1 ? "Account" : s === 2 ? "Store" : s === 3 ? "RDB" : "Terms"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-2xl flex items-start gap-3 animate-head-shake">
                            <FaExclamationTriangle className="text-red-500 mt-1 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400 font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Account Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in-right">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaUser />
                                        </div>
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaEnvelope />
                                        </div>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                                <FaLock />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                                <FaLock />
                                            </div>
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                required
                                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-500/20 p-6 rounded-3xl flex items-center justify-between cursor-pointer group hover:border-amber-500/40 transition-all" onClick={() => setIsSeller(!isSeller)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-xl">
                                            <FaStore />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-amber-900 dark:text-amber-400 leading-tight">I want to be a Seller</h4>
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-500/70">Register store & submit RDB documents</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="isSeller"
                                        className="w-6 h-6 text-amber-600 focus:ring-amber-500 border-gray-300 rounded-lg cursor-pointer transition-all"
                                        checked={isSeller}
                                        onChange={handleSellerToggle}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Store Info (Seller only) */}
                        {isSeller && step === 2 && (
                            <div className="space-y-6 animate-fade-in-right">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Store Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaStore />
                                        </div>
                                        <input
                                            name="storeName"
                                            type="text"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                            placeholder="My Awesome Shop"
                                            value={formData.storeName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Store Phone</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaPhone className="scale-x-[-1]" />
                                        </div>
                                        <input
                                            name="storePhone"
                                            type="text"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                            placeholder="+250 7XX XXX XXX"
                                            value={formData.storePhone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Store Description</label>
                                    <div className="relative group">
                                        <div className="absolute top-4 left-4 pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaInfoCircle />
                                        </div>
                                        <textarea
                                            name="storeDescription"
                                            rows="3"
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner resize-none"
                                            placeholder="Tell us about your store..."
                                            value={formData.storeDescription}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: RDB Documents (Seller only) */}
                        {isSeller && step === 3 && (
                            <div className="space-y-6 animate-fade-in-right">
                                <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
                                    <FaInfoCircle className="text-blue-500 text-2xl mt-1 shrink-0" />
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-400 leading-relaxed">
                                        To sell on Abelus, you need a valid TIN number and RDB certificate issued by the Rwanda Development Board.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">TIN Number *</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                                <FaIdCard />
                                            </div>
                                            <input
                                                name="tinNumber"
                                                type="text"
                                                required
                                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                                placeholder="9-digit TIN"
                                                maxLength={9}
                                                value={formData.tinNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Business Type *</label>
                                        <select
                                            name="businessType"
                                            className="block w-full px-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner appearance-none cursor-pointer font-bold"
                                            value={formData.businessType}
                                            onChange={handleChange}
                                        >
                                            <option value="sole_proprietor">Sole Proprietor</option>
                                            <option value="company">Company (LTD)</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="cooperative">Cooperative</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Registered Business Name *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-violet-600 transition-colors">
                                            <FaBuilding />
                                        </div>
                                        <input
                                            name="businessName"
                                            type="text"
                                            required
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                            placeholder="As registered with RDB"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">RDB Certificate *</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                id="rdbCertificate"
                                                name="rdbCertificate"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3 px-4 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl group-hover:border-violet-600 transition-all">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-violet-600 shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <FaFileUpload />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{fileNames.rdbCertificate || "Upload PDF or Image"}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RDB Certificate</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">National ID (Optional)</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                id="nationalId"
                                                name="nationalId"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3 px-4 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl group-hover:border-violet-600 transition-all">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-violet-600 shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <FaIdCard />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{fileNames.nationalId || "Upload PDF or Image"}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Front Side of ID</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Terms & Signature (Seller only) */}
                        {isSeller && step === 4 && (
                            <div className="space-y-6 animate-fade-in-right">
                                <div
                                    className="h-64 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium shadow-inner custom-scrollbar"
                                    ref={termsRef}
                                    onScroll={handleTermsScroll}
                                >
                                    <div
                                        className="prose prose-slate dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: termsContent.replace(/\n/g, "<br/>").replace(/#{1,3}\s/g, "")
                                        }}
                                    />
                                </div>

                                {!termsScrolled && (
                                    <p className="text-center text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest animate-bounce">⬇️ Please scroll to read terms</p>
                                )}

                                <div className={`flex items-start gap-4 p-6 rounded-3xl border-2 transition-all ${formData.termsAccepted ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20" : "bg-gray-50 dark:bg-slate-900 border-transparent"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        id="termsAccepted"
                                        name="termsAccepted"
                                        className="w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-lg cursor-pointer transition-all mt-1"
                                        checked={formData.termsAccepted}
                                        onChange={handleChange}
                                        disabled={!termsScrolled}
                                    />
                                    <label htmlFor="termsAccepted" className="text-sm font-bold text-gray-800 dark:text-gray-300 cursor-pointer leading-tight">
                                        I have read and agree to the Terms & Conditions and understand that Abelus will verify my RDB documents.
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                                        <FaSignature className="text-violet-600" />
                                        Digital Signature *
                                    </label>
                                    <input
                                        name="digitalSignature"
                                        type="text"
                                        required
                                        className="block w-full px-6 py-5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-violet-900 dark:text-violet-400 italic font-serif text-2xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all shadow-inner"
                                        placeholder="Type your full legal name"
                                        value={formData.digitalSignature}
                                        onChange={handleChange}
                                    />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">By typing your name, you are digitally signing this agreement</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-6">
                            {isSeller && step > 1 && (
                                <button
                                    type="button"
                                    className="flex-1 py-4 px-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-700 dark:text-gray-300 font-black hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                                    onClick={prevStep}
                                >
                                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
                                </button>
                            )}

                            {isSeller && step < 4 ? (
                                <button
                                    type="button"
                                    className="flex-[2] py-4 px-6 bg-violet-600 text-white rounded-2xl font-black text-lg hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-2 group"
                                    onClick={nextStep}
                                >
                                    Next Step <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-[2] py-4 px-6 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 group ${isSeller ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none" : "bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200 dark:shadow-none"
                                        }`}
                                >
                                    {loading ? (
                                        <><FaSpinner className="animate-spin text-2xl" /> {isSeller ? "Submitting Application..." : "Creating Account..."}</>
                                    ) : (
                                        <>{isSeller ? "Submit Application" : "Create Account"} <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Google Login Section */}
                        {!isSeller && step === 1 && (
                            <div className="pt-2">
                                <div className="relative my-10 text-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100 dark:border-slate-800"></div>
                                    </div>
                                    <div className="relative bg-white dark:bg-slate-950 px-6 inline-block">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-700 dark:text-gray-300 font-black hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm"
                                >
                                    <FaGoogle className="text-red-500 text-lg" />
                                    Continue with Google
                                </button>
                            </div>
                        )}

                        <div className="mt-12 text-center space-y-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Already have an account?{" "}
                                <Link to="/login" className="font-black text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors">
                                    Sign in here
                                </Link>
                            </p>
                            {!isSeller && (
                                <p className="text-[10px] font-bold text-gray-400 px-6 leading-relaxed">
                                    By registering, you agree to our{" "}
                                    <Link to="/terms" className="text-gray-600 dark:text-gray-300 underline hover:text-violet-600">Terms of Service</Link> and{" "}
                                    <Link to="/privacy" className="text-gray-600 dark:text-gray-300 underline hover:text-violet-600">Privacy Policy</Link>.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
