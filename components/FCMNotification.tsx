"use client";

import { useEffect, useRef } from "react";
import { requestNotificationPermission, requestForToken, onMessageListener } from "@/lib/firebase";
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
    const type = payload?.data?.type || payload?.data?.topic || payload?.from || "";
    if (type.includes("alert")) return "alerts";
    return "news";
}

export default function FCMNotification() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        // Only run when the user is authenticated
        if (!accessToken) return;

        let active = true;

        const setup = async () => {
            console.log("🏁 [FCM Web] Initializing web push notification setup...");

            // ── Step 0: Cleanup legacy service workers ────────────────────────────────
            // Conflicts between multiple SWs on identical/overlapping scopes cause 
            // the web push registration to hang or fail. We clear all EXCEPT the FCM one.
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    if (!reg.scope.includes('firebase-cloud-messaging-push-scope')) {
                        console.log(`🧼 [FCM Web] Unregistering legacy SW scope: ${reg.scope}`);
                        await reg.unregister();
                    }
                }
            } catch (err) {
                console.warn("⚠️ [FCM Web] SW Cleanup failed:", err);
            }

            // ── Step 1: Request browser notification permission ──────────────────────
            const permissionGranted = await requestNotificationPermission();
            if (!permissionGranted) {
                console.warn("🚫 [FCM Web] Notification permission not granted.");
                return;
            }

            if (!active) return;

            // ── Step 2: Obtain web FCM token ─────────────────────────────────────────
            let token: string | undefined;
            try {
                token = await requestForToken();
            } catch (err) {
                console.error("❌ [FCM Web] Failed to obtain FCM token:", err);
                return;
            }

            if (!token) {
                console.warn("⚠️ [FCM Web] No FCM token returned.");
                return;
            }

            if (!active) return;
            console.log("🔑 [FCM Web] Token obtained (first 12):", token.slice(0, 12) + "...");

            // ── Step 3: Register web token with backend ──────────────────────────────
            const user = useAuthStore.getState().user;

            // Increment the cache key version (v2) to force re-registration
            // This ensures everyone gets the latest subscription logic on the backend.
            const lastSentKey = `fcm_web_token_v2_${user?.id || "guest"}`;
            const lastSentToken = localStorage.getItem(lastSentKey);

            if (lastSentToken !== token) {
                console.log(`📡 [FCM Web] Registering web FCM token with backend for user ${user?.id || "guest"}...`);
                try {
                    await updateFcmToken({ web_fcm_token: token });
                    localStorage.setItem(lastSentKey, token);
                    console.log("✅ [FCM Web] Token registered & subscribed successfully.");
                } catch (err) {
                    console.warn("⚠️ [FCM Web] Token registration failed:", err);
                }
            } else {
                console.log("ℹ️ [FCM Web] Token already synchronised (v2).");
            }

            if (!active) return;

            // ── Step 4: Shared handler ──────────────────────────────────────────────
            const handleAddNotification = (payload: any) => {
                const title = payload.data?.title || payload.notification?.title || "Notification";
                const body = payload.data?.body || payload.notification?.body || "";
                const id = payload?.messageId || payload?.data?.id || Math.random().toString(36).substring(7);
                const topic = detectTopic(payload);

                useNotificationStore.getState().addNotification({
                    id, title, body, type: topic, data: payload.data,
                });

                return { title, body, topic, id };
            };

            // ── Step 5A: Listen for background broadcasts from SW ────────────────────
            const swListener = (event: MessageEvent) => {
                if (event.data?.type === "FCM_NOTIFICATION") {
                    console.log("📨 [FCM Web] SW Broadcast:", event.data.action);
                    handleAddNotification(event.data.payload);
                }
            };

            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.addEventListener("message", swListener);
            }

            // ── Step 5B: Foreground message listener ────────────────────────────────
            const unsub = await onMessageListener((payload: any) => {
                console.log("🔔 [FCM Web] Foreground message:", payload);

                if (payload?.data || payload?.notification) {
                    const { title, body, topic, id } = handleAddNotification(payload);
                    const config = TOPIC_CONFIG[topic];

                    // OS Notification via SW for foreground
                    if ("serviceWorker" in navigator && Notification.permission === "granted") {
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.showNotification(title, {
                                body,
                                icon: "/assets/images/img_logo.png",
                                badge: "/assets/images/img_logo.png",
                                data: {
                                    url: payload.data?.url || (topic === "news" && id ? `/dashboard/news/${id}` : config.defaultUrl),
                                    topic, id,
                                },
                            });
                        });
                    }

                    // In-app Alert (Premium UI)
                    toast.custom((t) => (
                        <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10`}>
                            <div className="flex-1 w-0 p-4 font-inter">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
                                        <span className="text-xl">{config.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{body}</p>
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

            return () => {
                if ("serviceWorker" in navigator) {
                    navigator.serviceWorker.removeEventListener("message", swListener);
                }
                if (unsub) unsub();
            };
        };

        const setupPromise = setup();

        return () => {
            active = false;
            setupPromise.then((cleanup) => cleanup && cleanup());
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = undefined;
            }
        };
    }, [accessToken]);

    return null;
}
