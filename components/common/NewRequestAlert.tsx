"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ServiceRequest } from "@/types/myrequest";
import { FiUser } from "react-icons/fi";
import { clsx } from "clsx";

const COUNTDOWN_SECONDS = 30;

interface NewRequestAlertProps {
    request: ServiceRequest;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
    onClose?: () => void;
}

export default function NewRequestAlert({
    request,
    onAccept,
    onReject,
    onClose,
}: NewRequestAlertProps) {
    const [accepting, setAccepting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [visible, setVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoClosedRef = useRef(false);

    // Slide-in on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    // ── Auto-close handler (stable reference) ──────────────────────────
    const triggerAutoClose = useCallback(() => {
        if (autoClosedRef.current) return;
        autoClosedRef.current = true;
        onClose?.();
    }, [onClose]);

    // ── 30-second countdown ──────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft <= 0) {
            triggerAutoClose();
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, triggerAutoClose]);

    // Stop timer when user acts
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleAccept = async () => {
        stopTimer();
        setAccepting(true);
        try {
            await onAccept();
        } finally {
            setAccepting(false);
        }
    };

    const handleReject = async () => {
        stopTimer();
        setRejecting(true);
        try {
            await onReject();
        } finally {
            setRejecting(false);
        }
    };

    // ── SVG arc progress ─────────────────────────────────────────────────
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const progress = timeLeft / COUNTDOWN_SECONDS;     // 1 → 0
    const dashOffset = circumference * (1 - progress); // filled → empty

    // Colour shifts red in the last 10 seconds
    const isUrgent = timeLeft <= 10;
    const ringColour = isUrgent ? "#D92D20" : "#0056D2";
    const textColour = isUrgent ? "text-red-600 dark:text-red-400" : "text-[#0056D2] dark:text-blue-400";

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/60 transition-opacity duration-300 backdrop-blur-sm",
                    visible ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Modal */}
            <div
                className={clsx(
                    "relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl transition-all duration-350 ease-out flex flex-col overflow-hidden",
                    visible
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-full sm:translate-y-4 sm:opacity-0 sm:scale-95",
                    isUrgent && "animate-pulse-border"
                )}
            >
                {/* Drag handle (mobile) */}
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 sm:hidden" />

                <div className="px-6 py-4 flex flex-col gap-5">
                    {/* Header: Title + Timer */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Request</h2>

                        {/* Countdown ring */}
                        <div className="relative flex items-center justify-center" title={`Auto-closes in ${timeLeft}s`}>
                            <svg width="56" height="56" className="-rotate-90">
                                {/* Track */}
                                <circle
                                    cx="28" cy="28" r={radius}
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="4"
                                />
                                {/* Progress arc */}
                                <circle
                                    cx="28" cy="28" r={radius}
                                    fill="none"
                                    stroke={ringColour}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                                />
                            </svg>
                            {/* Number in centre */}
                            <span className={clsx(
                                "absolute text-sm font-bold tabular-nums",
                                textColour
                            )}>
                                {timeLeft}s
                            </span>
                        </div>
                    </div>

                    {/* Urgency hint */}
                    {isUrgent && (
                        <p className="text-xs text-red-500 dark:text-red-400 text-center -mt-2 font-medium animate-pulse">
                            ⚠️ Auto-closing in {timeLeft} second{timeLeft !== 1 ? "s" : ""}…
                        </p>
                    )}

                    {/* Request Details Card */}
                    <div className="bg-[#F2F4F7] dark:bg-gray-700/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-[#A5C1F0] dark:bg-blue-900/40 flex items-center justify-center text-[#0056D2] dark:text-blue-400 flex-shrink-0">
                            <FiUser size={32} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {request.customerName || "Customer"}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    {request.serviceType || "General"}
                                </li>
                                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    {request.serviceName || "Service"}
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pb-4">
                        <button
                            onClick={handleAccept}
                            disabled={accepting || rejecting}
                            className={clsx(
                                "w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg shadow-lg",
                                accepting ? "bg-blue-400 cursor-not-allowed" : "bg-[#0056D2] hover:bg-[#004BB9]"
                            )}
                        >
                            {accepting ? (
                                <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Accept"
                            )}
                        </button>

                        <button
                            onClick={handleReject}
                            disabled={accepting || rejecting}
                            className={clsx(
                                "w-full py-4 rounded-xl font-bold border transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg",
                                rejecting
                                    ? "bg-red-50 border-red-200 text-red-300 cursor-not-allowed"
                                    : "border-[#D92D20] text-[#D92D20] bg-white hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-950/30"
                            )}
                        >
                            {rejecting ? (
                                <div className="w-6 h-6 border-[3px] border-red-200 border-t-[#D92D20] rounded-full animate-spin" />
                            ) : (
                                "Reject"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
