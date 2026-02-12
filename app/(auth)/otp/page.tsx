"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyOtpSmart, sendOtp } from "@/lib/auth";
import { FiRefreshCw } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [mobile, setMobile] = useState("");
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasShownToast = useRef(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const mobileParam = searchParams.get("mobile");
    const newUserParam = searchParams.get("new");
    const sentParam = searchParams.get("sent"); // add this flag when redirecting from login

    if (!mobileParam) {
      toast.error("Mobile number is required");
      router.replace("/");
      return;
    }

    setMobile(mobileParam);

    const detectedNewUser = newUserParam === "1";
    setIsNewUser(detectedNewUser);

    console.log(`[OTP Page init] isNewUser from URL = ${detectedNewUser}`);

    // ✅ Only show toast if redirected with ?sent=1
    if (sentParam === "1" && !hasShownToast.current) {
      toast.success(`OTP sent to ${formatMobileNumber(mobileParam)}`);
      hasShownToast.current = true;
    }
  }, [searchParams, router]);


  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length === 6) {
      const digits = value.split("");
      setOtp(digits.slice(0, 6));
      inputRefs.current[5]?.focus();
      handleVerify(digits.join(""));
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }

    if (newOtp.every(d => d !== "") && index === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      setTimeout(() => inputRefs.current[5]?.focus(), 10);
      toast.success("OTP pasted successfully");
      handleVerify(digits.join(""));
    } else {
      toast.error("Please paste a valid 6-digit OTP");
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const otpString = otpValue || otp.join("");

    if (otpString.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtpSmart(mobile, otpString, isNewUser);

      if (isNewUser) {
        toast.success("OTP verified! Please complete your registration.");
        const verifyId = result.id;
        if(!verifyId){
          throw new Error("No verification id")
        }
        router.replace(`/register?mobile=${mobile}&id=${verifyId}`);
        console.log(`${verifyId}`)
      } else {
        const { user, accessToken } = result;
        if (user && accessToken) {
          useAuthStore.getState().setAuth(user, accessToken);
          toast.success("Login successful!");
          router.replace("/dashboard");
        } else {
          throw new Error("Authentication data incomplete");
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.message || "OTP verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend && timer > 0) {
      toast.error(`Please wait ${formatTime(timer)} before resending`);
      return;
    }

    setIsResending(true);

    try {
      const { isNewUser: newFlow } = await sendOtp(mobile);

      setIsNewUser(newFlow);

      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      toast.success(`OTP resent to ${formatMobileNumber(mobile)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };


  const formatMobileNumber = (num: string) =>
    num.length === 10 ? `+91 ${num.slice(0, 5)} ${num.slice(5)}` : `+91 ${num}`;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChangeMobileNumber = () => {
    router.push("/");
  };


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="Thendral Booking"
            className="h-16 mx-auto mb-4"
          />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verify OTP
          </h2>

          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enter the 6-digit code sent to
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {formatMobileNumber(mobile)}
            </p>
            <button
              onClick={handleChangeMobileNumber}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>

        </div>

        {/* OTP Inputs */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength={1}
                inputMode="numeric"
                disabled={isLoading}
                autoFocus={index === 0}
                className="w-11 h-11 text-center text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>

          {/* Removed timer display from here */}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isLoading || otp.join("").length !== 6}
          className={`w-full py-3 rounded-lg font-medium transition mb-4
            ${otp.join("").length === 6 && !isLoading
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            }`}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* Resend OTP / Timer Section */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't get OTP?{" "}
            {timer > 0 ? (
              <span className="text-blue-600 dark:text-blue-400">
                {formatTime(timer)}
              </span>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className={`text-sm font-medium transition-colors ${isResending
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer font-semibold"
                  }`}
              >
                {isResending ? (
                  <span className="flex items-center justify-center gap-1 ">
                    <FiRefreshCw className="animate-spin w-3 h-3" />
                    Resending...
                  </span>
                ) : (
                  "Resend OTP"
                )}
              </button>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}