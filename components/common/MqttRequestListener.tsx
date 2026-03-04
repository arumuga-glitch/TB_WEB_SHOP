"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShopStore, ShopStore } from "@/store/shopStore";
import { useServiceRequestStore } from "@/store/request.store";
import { useMqttNewRequest } from "@/hooks/useMqttNewRequest";
import NewRequestAlert from "@/components/common/NewRequestAlert";
import toast from "react-hot-toast";

export default function MqttRequestListener() {
    const router = useRouter();
    const shop = useShopStore((state: ShopStore) => state.shop);
    const shopId = shop?.id;
    const isOnline = shop?.is_online ?? false;

    const { accept, reject, fetchRequests, setHighlightedRequestId } = useServiceRequestStore();
    const { incoming, dismiss } = useMqttNewRequest(shopId, isOnline);

    const lastNotifiedId = useRef<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Stop alert sound
    const stopAlert = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    }, []);

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        return () => stopAlert();
    }, [stopAlert]);

    // ── On visibility restore: re-fetch requests to catch anything that arrived
    //    while the WebSocket was disconnected (tab was closed / backgrounded) ──
    useEffect(() => {
        if (!shopId || !isOnline) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // Small delay so auth store hydrates first (same guard as AppProvider)
                setTimeout(() => {
                    fetchRequests(shopId, false);
                }, 500);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [shopId, isOnline, fetchRequests]);

    // Handle Notifications and Sound when new request arrives
    useEffect(() => {
        if (!incoming || !isOnline || lastNotifiedId.current === incoming.request.id) return;

        // Play alert sound
        const playAlert = () => {
            stopAlert();
            const audio = new Audio("/assets/audio/alert_msg.mp3");
            audio.loop = true;
            audioRef.current = audio;
            audio.play().catch(err => {
                console.warn("Audio playback blocked by browser policy:", err);
            });
        };

        playAlert();

        if (document.visibilityState === "hidden") {
            if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification("New Service Request! 🔔", {
                    body: `${incoming.request.customerName} requested ${incoming.request.serviceName}`,
                    icon: "/favicon.ico",
                    tag: incoming.request.id,
                    requireInteraction: true,
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    router.push("/dashboard/requests");
                };
            }
        }

        lastNotifiedId.current = incoming.request.id;
    }, [incoming, isOnline, router, stopAlert]);

    const handleAccept = useCallback(async () => {
        if (!incoming || !shopId) return;
        const requestId = incoming.request.id;
        try {
            await accept(requestId, shopId);
            toast.success("✅ Request accepted!");
            stopAlert();
            router.push("/dashboard/requests");
            setHighlightedRequestId(requestId);
            dismiss();
            setTimeout(() => shopId && fetchRequests(shopId, false), 1500);
        } catch {
            toast.error("Failed to accept request");
        }
    }, [incoming, shopId, accept, fetchRequests, stopAlert, dismiss, router, setHighlightedRequestId]);

    const handleReject = useCallback(async () => {
        if (!incoming || !shopId) return;
        const reason = "Shop unavailable at this time";
        try {
            await reject(incoming.request.id, shopId, reason);
            toast.success("Request rejected");
            stopAlert();
            dismiss();
            setTimeout(() => shopId && fetchRequests(shopId, false), 1500);
        } catch {
            toast.error("Failed to reject request");
        }
    }, [incoming, shopId, reject, fetchRequests, stopAlert, dismiss]);

    if (!incoming || !isOnline) return null;

    return (
        <NewRequestAlert
            request={incoming.request}
            onAccept={handleAccept}
            onReject={handleReject}
            onClose={() => {
                stopAlert();
                dismiss();
            }}
        />
    );
}
