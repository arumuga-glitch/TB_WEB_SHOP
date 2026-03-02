"use client";

import { useEffect } from "react";
import { requestForToken, onMessageListener } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/store/notificationStore";

export default function FCMNotification() {
    useEffect(() => {
        let unsubscribeFn: (() => void) | undefined;

        const setup = async () => {
            try {
                // 1. Get the FCM token
                const token = await requestForToken();
                if (token) {
                    console.log("FCM Token initialized:", token);
                    // TODO: Send token to your backend via Swagger API
                }

                // 2. Subscribe to foreground messages
                const unsub = await onMessageListener((payload: any) => {
                    console.log("Foreground message received:", payload);

                    if (payload?.notification) {
                        const title = payload.notification.title || "Notification";
                        const body = payload.notification.body || "";
                        const icon = payload.notification.image || "/assets/images/img_logo.png";

                        // Save to notification bell store
                        useNotificationStore.getState().addNotification({
                            title,
                            body,
                            type: "news",
                            data: payload.data,
                        });

                        // Show OS system notification via service worker (even when tab is open)
                        if ("serviceWorker" in navigator && Notification.permission === "granted") {
                            navigator.serviceWorker.ready.then((registration) => {
                                registration.showNotification(title, {
                                    body,
                                    icon,
                                    badge: "/assets/images/img_logo.png",
                                    data: { url: payload.data?.url || "/dashboard/news" },
                                });
                            });
                        }

                        // Show in-app toast popup
                        toast.custom((t) => (
                            <div
                                className={`${t.visible ? "animate-enter" : "animate-leave"
                                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <span className="text-blue-600 dark:text-blue-400 text-sm">📰</span>
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

                if (unsub) unsubscribeFn = unsub;
            } catch (error) {
                console.error("Error setting up FCM:", error);
            }
        };

        setup();

        return () => {
            if (unsubscribeFn) unsubscribeFn();
        };
    }, []);

    return null;
}
