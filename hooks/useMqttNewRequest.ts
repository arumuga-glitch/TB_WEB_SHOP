

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

export function useMqttNewRequest(shopId: string | undefined, isOnline: boolean = true): UseMqttNewRequestReturn {
    const [incoming, setIncoming] = useState<IncomingRequest | null>(null);
    const [connected, setConnected] = useState(false);
    const { fetchRequests, addRequest } = useServiceRequestStore();

    const fetchRequestsRef = useRef(fetchRequests);
    useEffect(() => {
        fetchRequestsRef.current = fetchRequests;
    }, [fetchRequests]);

    const dismiss = useCallback(() => setIncoming(null), []);

    useEffect(() => {
        if (!shopId || !isOnline) {
            setConnected(false);
            return;
        }

        const topic = newRequestTopic(shopId);

        const handleMessage = (payload: unknown) => {
            console.log("🔔 [MQTT HOOK] Received message payload:", payload);
            setConnected(true);
            // Removed redundant fetchRequests call to prevent race condition with addRequest

            // Try to parse the raw request from the MQTT payload
            let serviceRequest: ServiceRequest | null = null;

            if (payload && typeof payload === "object") {
                try {
                    serviceRequest = mapMqttToUI(payload);
                } catch {
                }
            }

            if (serviceRequest) {
                addRequest(serviceRequest);
                setIncoming({
                    request: serviceRequest,
                    receivedAt: new Date().toISOString(),
                });
            }
        };

        const unsubscribe = subscribeToTopic(topic, handleMessage);

        setConnected(true);

        return () => {
            unsubscribe();
            setConnected(false);
        };
    }, [shopId, isOnline]);

    return { incoming, dismiss, connected };
}
