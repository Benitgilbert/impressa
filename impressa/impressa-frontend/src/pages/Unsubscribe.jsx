import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FaHeartBroken, FaCheckCircle } from "react-icons/fa";
import api from "../utils/axiosInstance";

export default function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    const [status, setStatus] = useState("loading"); // loading, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const unsubscribe = async () => {
            if (!email) {
                setStatus("error");
                setMessage("No email address provided.");
                return;
            }

            try {
                await api.get(`/newsletter/unsubscribe/${email}`);
                setStatus("success");
            } catch (err) {
                console.error("Unsubscribe failed:", err);
                setStatus("error");
                setMessage(err.response?.data?.message || "Failed to unsubscribe. Please try again.");
            }
        };

        unsubscribe();
    }, [email]);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-charcoal-800 rounded-3xl shadow-xl p-8 text-center border border-cream-200 dark:border-charcoal-700">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h2 className="text-2xl font-black text-charcoal-800 dark:text-white mb-2">Unsubscribing...</h2>
                        <p className="text-charcoal-500 dark:text-charcoal-400">Please wait while we update your preferences.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mb-6">
                            <FaCheckCircle className="text-4xl" />
                        </div>
                        <h2 className="text-2xl font-black text-charcoal-800 dark:text-white mb-4">Successfully Unsubscribed</h2>
                        <p className="text-charcoal-500 dark:text-charcoal-400 mb-8">
                            We're sorry to see you go! You have been removed from our mailing list.
                        </p>
                        <Link
                            to="/"
                            className="bg-charcoal-800 dark:bg-white text-white dark:text-charcoal-900 px-8 py-3 rounded-xl font-bold hover:bg-charcoal-700 dark:hover:bg-cream-100 transition-colors"
                        >
                            Return Home
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <div className="w-20 h-20 bg-terracotta-100 dark:bg-terracotta-900/20 rounded-full flex items-center justify-center text-terracotta-500 mb-6">
                            <FaHeartBroken className="text-4xl" />
                        </div>
                        <h2 className="text-2xl font-black text-charcoal-800 dark:text-white mb-4">Unsubscribe Failed</h2>
                        <p className="text-charcoal-500 dark:text-charcoal-400 mb-8">
                            {message}
                        </p>
                        <div className="flex gap-4">
                            <Link
                                to="/"
                                className="px-6 py-3 rounded-xl font-bold bg-cream-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-600 transition-colors"
                            >
                                Go Home
                            </Link>
                            <Link
                                to="/contact"
                                className="px-6 py-3 rounded-xl font-bold bg-terracotta-500 text-white hover:bg-terracotta-600 transition-colors"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
