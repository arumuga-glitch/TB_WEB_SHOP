"use client";

import { useEffect, useRef } from "react";
import { requestForToken, onMessageListener } from "@/lib/firebase";
import { updateFcmToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/store/notificationStore";

// FCM Topics supported
const FCM_TOPICS = ["news", "alerts"] as const;
type FcmTopic = typeof FCM_TOPICS[number];

// Topic-specific display config
const TOPIC_CONFIG: Record<FcmTopic, { icon: string; defaultUrl: string }> = {
    news: { icon: "📰", defaultUrl: "/dashboard/news" },
    alerts: { icon: "🔔", defaultUrl: "/dashboard" },
};

// Detect topic from FCM message payload
function detectTopic(payload: any): FcmTopic {
    const rawTopic = payload?.data?.topic || "";
    if (rawTopic.includes("alerts")) return "alerts";
    return "news";
}

export default function FCMNotification() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        if (!accessToken) return;

        let active = true;

        const setup = async () => {
            try {
                const token = await requestForToken();
                if (!token || !active) return;

                console.log("FCM Token:", token);

                // 2. Register token with backend (skip if already sent this session)
                const lastSentToken = localStorage.getItem("fcm_token_sent");
                if (lastSentToken !== token) {
                    try {
                        await updateFcmToken({ web_fcm_token: token });
                        localStorage.setItem("fcm_token_sent", token);
                        console.log("FCM token registered with backend.");
                    } catch (err) {
                        // Non-fatal — will retry on next authenticated load
                        console.warn("FCM token registration failed (will retry next load):", err);
                    }
                }

                if (!active) return;

                // 3. Subscribe to foreground messages (news + alerts topics)
                const unsub = await onMessageListener((payload: any) => {
                    console.log("Foreground FCM message received:", payload);

                    if (payload?.notification) {
                        const title = payload.notification.title || "Notification";
                        const body = payload.notification.body || "";
                        const icon = payload.notification.image || "/assets/images/img_logo.png";
                        const topic = detectTopic(payload);
                        const config = TOPIC_CONFIG[topic];

                        // Save to notification bell store with correct topic type
                        useNotificationStore.getState().addNotification({
                            title,
                            body,
                            type: topic,
                            data: payload.data,
                        });

                        // Show OS system notification via service worker
                        if ("serviceWorker" in navigator && Notification.permission === "granted") {
                            navigator.serviceWorker.ready.then((registration) => {
                                registration.showNotification(title, {
                                    body,
                                    icon,
                                    badge: "/assets/images/img_logo.png",
                                    data: {
                                        url: payload.data?.url || config.defaultUrl,
                                        topic,
                                    },
                                });
                            });
                        }

                        // Show in-app toast with topic-aware icon
                        toast.custom((t) => (
                            <div
                                className={`${t.visible ? "animate-enter" : "animate-leave"
                                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <span className="text-blue-600 dark:text-blue-400 text-sm">
                                                {config.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ), { duration: 5000 });
                    }
                });

                if (unsub) unsubscribeRef.current = unsub;
            } catch (error) {
                console.error("Error setting up FCM:", error);
            }
        };

        setup();

        return () => {
            active = false;
            // Unsubscribe foreground listener on logout / unmount
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = undefined;
            }
        };
    }, [accessToken]); 

    return null;
}
