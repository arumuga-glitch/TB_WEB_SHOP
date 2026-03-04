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


const TOPIC_CONFIG: Record<FcmTopic, { icon: string; defaultUrl: string }> = {
    news: { icon: "📰", defaultUrl: "/dashboard/news" },
    alerts: { icon: "🔔", defaultUrl: "/dashboard" },
};

// Detect topic from FCM message payload
function detectTopic(payload: any): FcmTopic {
    const type = payload?.data?.type || payload?.data?.topic || "";
    if (type.includes("alert")) return "alerts";
    return "news";
}

export default function FCMNotification() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        if (!accessToken) return;

        let active = true;

        const setup = async () => {
            console.log("🏁 Initializing FCM Setup...");
            try {
                const token = await requestForToken();
                if (!token || !active) return;

                console.log("🔑 FCM Token Obtained:", token);

                const lastSentToken = localStorage.getItem("fcm_token_sent");
                if (lastSentToken !== token) {
                    console.log("📡 Registering new FCM token with backend...");
                    try {
                        await updateFcmToken({ web_fcm_token: token });
                        localStorage.setItem("fcm_token_sent", token);
                        console.log("✅ FCM token registered with backend successfully.");
                    } catch (err) {
                        console.warn("⚠️ FCM token registration failed (backend unavailable or error):", err);
                    }
                } else {
                    console.log("ℹ️ FCM token already synchronized with backend (cached).");
                }

                if (!active) return;

                // Reusable handler for adding notifications to store
                const handleAddNotification = (payload: any) => {
                    const title = payload.data?.title || payload.notification?.title || "Notification";
                    const body = payload.data?.body || payload.notification?.body || "";
                    const id = payload?.messageId || payload?.data?.id || Math.random().toString(36).substring(7);
                    const topic = detectTopic(payload);

                    useNotificationStore.getState().addNotification({
                        id,
                        title,
                        body,
                        type: topic,
                        data: payload.data,
                    });

                    return { title, body, topic, id };
                };

                // A. Listen for background/sw-triggered messages
                const swListener = (event: MessageEvent) => {
                    if (event.data?.type === 'FCM_NOTIFICATION') {
                        console.log("📨 Received broadcast from SW:", event.data);
                        handleAddNotification(event.data.payload);
                    }
                };
                navigator.serviceWorker.addEventListener('message', swListener);

                // 3. Subscribe to foreground messages (news + alerts topics)
                const unsub = await onMessageListener((payload: any) => {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log("🔔 FCM Message Received:", payload);
                    }

                    if (payload?.data || payload?.notification) {
                        const { title, body, topic, id } = handleAddNotification(payload);
                        const config = TOPIC_CONFIG[topic];
                        const icon = "/assets/images/img_logo.png";

                        // OS-level notification (Background/Foreground hybrid)
                        if ("serviceWorker" in navigator && Notification.permission === "granted") {
                            navigator.serviceWorker.ready.then((registration) => {
                                registration.showNotification(title, {
                                    body,
                                    icon,
                                    badge: "/assets/images/img_logo.png",
                                    data: {
                                        url: payload.data?.url || (topic === 'news' && id ? `/dashboard/news/${id}` : config.defaultUrl),
                                        topic,
                                        id
                                    },
                                });
                            });
                        }

                        // Premium UI Toast
                        toast.custom((t) => (
                            <div
                                className={`${t.visible ? "animate-enter" : "animate-leave"
                                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
                                            <span className="text-xl">
                                                {config.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {title}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-l border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 focus:outline-none"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ), { duration: 6000 });
                    }
                });

                if (unsub) unsubscribeRef.current = unsub;

                // Cleanup SW listener
                return () => {
                    navigator.serviceWorker.removeEventListener('message', swListener);
                    if (unsub) unsub();
                };
            } catch (error) {
                console.error("Error setting up FCM:", error);
            }
        };

        const setupPromise = setup();

        return () => {
            active = false;
            setupPromise.then(cleanup => cleanup && cleanup());
            // Unsubscribe foreground listener on logout / unmount
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = undefined;
            }
        };
    }, [accessToken]);

    return null;
}
