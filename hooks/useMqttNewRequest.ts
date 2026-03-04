"use client";

import { useEffect, useState, useCallback } from "react";
import { subscribeToTopic, newRequestTopic } from "@/lib/mqtt-service";
import { useServiceRequestStore, mapMqttToUI } from "@/store/request.store";
import { ServiceRequest } from "@/types/myrequest";

export interface IncomingRequest {
    request: ServiceRequest;
    receivedAt: string;
}

interface UseMqttNewRequestReturn {
    incoming: IncomingRequest | null;
    dismiss: () => void;
    connected: boolean;
}

// ─── Offline-request persistence helpers ──────────────────────────────────────
// When a customer sends a request while the shop owner has closed/backgrounded
// the app, the MQTT broker won't deliver the message (the WebSocket disconnects).
// But the BACKEND still stores the request. We periodically fetch requests to
// cover this gap. However, if the MQTT message DID arrive just before the app
// closed, we persist it in localStorage so it pops up when the app reopens.

const PENDING_KEY = "mqtt_pending_request";

function savePendingRequest(req: ServiceRequest): void {
    try {
        const entry = { request: req, receivedAt: new Date().toISOString() };
        localStorage.setItem(PENDING_KEY, JSON.stringify(entry));
    } catch { /* localStorage not available */ }
}

function loadAndClearPendingRequest(): IncomingRequest | null {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        localStorage.removeItem(PENDING_KEY);
        const parsed = JSON.parse(raw) as IncomingRequest;
        // Only replay if the request arrived in the last 5 minutes
        const age = Date.now() - new Date(parsed.receivedAt).getTime();
        if (age > 5 * 60 * 1000) return null; // stale – ignore
        return parsed;
    } catch {
        return null;
    }
}
// ──────────────────────────────────────────────────────────────────────────────

export function useMqttNewRequest(shopId: string | undefined, isOnline: boolean = true): UseMqttNewRequestReturn {
    const [incoming, setIncoming] = useState<IncomingRequest | null>(null);
    const [connected, setConnected] = useState(false);
    const { addRequest } = useServiceRequestStore();

    const dismiss = useCallback(() => {
        setIncoming(null);
    }, []);

    // ── On mount: replay any request that was received when the app was closed ──
    useEffect(() => {
        if (!isOnline) return;

        const pending = loadAndClearPendingRequest();
        if (pending) {
            console.log("📦 [MQTT] Replaying offline-received request:", pending.request.id);
            addRequest(pending.request);
            setIncoming(pending);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    // ── Subscribe to live MQTT topic ───────────────────────────────────────────
    useEffect(() => {
        if (!shopId || !isOnline) {
            setConnected(false);
            return;
        }

        const topic = newRequestTopic(shopId);

        const handleMessage = (payload: unknown) => {
            console.log("🔔 [MQTT HOOK] Received message payload:", payload);
            setConnected(true);

            let serviceRequest: ServiceRequest | null = null;

            if (payload && typeof payload === "object") {
                try {
                    serviceRequest = mapMqttToUI(payload);
                } catch { /* parse error */ }
            }

            if (serviceRequest) {
                addRequest(serviceRequest);

                const entry: IncomingRequest = {
                    request: serviceRequest,
                    receivedAt: new Date().toISOString(),
                };

                // Always persist to localStorage immediately so that if the tab/app
                // is closed before the user responds, it will be shown on next open.
                savePendingRequest(serviceRequest);

                setIncoming(entry);
            }
        };

        const unsubscribe = subscribeToTopic(topic, handleMessage);
        setConnected(true);

        return () => {
            unsubscribe();
            setConnected(false);
        };
    }, [shopId, isOnline, addRequest]);

    // ── When user dismisses, also clear the persisted entry ───────────────────
    const dismissAndClear = useCallback(() => {
        try { localStorage.removeItem(PENDING_KEY); } catch { }
        dismiss();
    }, [dismiss]);

    return { incoming, dismiss: dismissAndClear, connected };
}
