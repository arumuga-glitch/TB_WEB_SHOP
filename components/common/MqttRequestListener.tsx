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

    // Handle Notifications and Sound when new request arrives
    useEffect(() => {
        if (!incoming || !isOnline || lastNotifiedId.current === incoming.request.id) return;

        // Play alert sound
        const playAlert = () => {
            // Stop any existing alert first
            stopAlert();

            const audio = new Audio("/assets/audio/alert_msg.mp3");
            audio.loop = true; // Loop until acted upon
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
                    tag: incoming.request.id, // Prevent duplicate notifications for same ID
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

            // Navigate to request page first
            router.push("/dashboard/requests");

            // Set highlight ID to ensure it highlights when the page loads
            setHighlightedRequestId(requestId);

            dismiss();
            // Sync temp MQTT entry → real API entry after server commits
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
            // Sync temp MQTT entry → real API entry after server commits
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
        />
    );
}
