"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtp } from "@/lib/auth";
import { FaWhatsapp } from "react-icons/fa";

export default function LoginPage() {
    const [mobile, setMobile] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const isValid = /^[6-9]\d{9}$/.test(mobile);

    const validateMobile = () => {
        if (!mobile.trim()) {
            setError("Mobile number is required");
            return false;
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            setError("Enter a valid 10-digit Indian mobile number");
            return false;
        }
        return true;
    };

    const handleWhatsAppLogin = async () => {
        if (!validateMobile()) return;

        setIsLoading(true);
        setError("");
        try {
            const { isNewUser } = await sendOtp(mobile);

            // Pass the real value from backend detection
            const query = new URLSearchParams({
                mobile,
                new: isNewUser ? "1" : "0",
            });

            router.push(`/otp?${query.toString()}`);
        } catch (err: any) {
            setError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && isValid && !isLoading) {
            handleWhatsAppLogin();
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo/Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center mb-4">
                        <a href="/" className="flex items-center">
                            <img
                                alt="Thendral Booking"
                                width="180"
                                height="60"
                                decoding="async"
                                className="h-20 w-auto"
                                src="/logo.svg"
                            />
                        </a>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Login to manage your services
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Mobile Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mobile Number
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                +91
                            </div>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 10) {
                                        setMobile(value);
                                        setError("");
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter 10-digit number"
                                className="w-full pl-14 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                maxLength={10}
                                disabled={isLoading}
                            />
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* WhatsApp Login Button */}
                    <button
                        onClick={handleWhatsAppLogin}
                        disabled={!isValid || isLoading}
                        className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all 
              ${isValid && !isLoading
                                ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                                : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Sending OTP...
                            </span>
                        ) : (
                            <>
                                <FaWhatsapp className="w-5 h-5" />
                                <span>Continue with WhatsApp</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        By continuing, you agree to our{" "}
                        <a
                            href="/terms"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Terms
                        </a>{" "}
                        and{" "}
                        <a
                            href="/privacy"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Privacy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
