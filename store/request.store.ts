import { create } from 'zustand';
import api from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { RawServiceRequest, RequestStatus, ServiceRequest, TimelineEvent } from '@/types/myrequest';

const mapTimelineStatus = (log: string): TimelineEvent['status'] => {
    if (log.toLowerCase().includes('completed')) return 'success';
    if (log.toLowerCase().includes('paid')) return 'success';
    if (log.toLowerCase().includes('rejected')) return 'error';
    return 'info';
};

export const mapToUI = (item: RawServiceRequest): ServiceRequest => {
    const date = new Date(item.created_at);

    return {
        id: item.id,
        customerName: item.user_data.name,
        customerPhone: item.user_data.mobile_number,
        serviceName: item.service_data.service.name,
        serviceType: item.service_data.service_type?.name ?? "General",
        serviceDetails: item.service_data.service.description.replace(/<[^>]*>/g, ''),
        location: item.service_data.address,

        requestedDate: date.toLocaleDateString(),
        requestedTime: date.toLocaleTimeString(),

        status: item.status,
        priority: 'medium',

        amount: item.service_data.service.total_price,

        shopName: item.shop_data.name,
        shopLocation: item.shop_data.address,
        shopRating: 4.5,

        timeline: item.logs?.map((log) => ({
            id: log.id,
            timestamp: log.created_at,
            title: log.log.split(':')[0]?.trim() || 'Update',
            description: log.log,
            status: mapTimelineStatus(log.log),
        })) ?? [],

        priceDetails: [
            // 1️⃣ Service Fee
            {
                id: `${item.service_data.service.id}-service-fee`,
                label: item.service_data.service.name,
                amount: item.service_data.service.service_fee ?? 0,
                category: 'service',
                isMandatory: true,
                isCustom: false,
            },

            // 2️⃣ Platform / additional fees 
            ...(item.service_data.service_fee ?? []).map((fee) => {
                const isCustom = fee.is_mandatory === false && fee.active !== true;
                return {
                    id: fee.id,
                    label: fee.name,
                    amount: fee.price ?? fee.charge ?? 0,
                    category: 'additional' as const,
                    isMandatory: !isCustom,
                    isCustom,
                };
            }),
        ],

        payment_status: item.payment_status,
        otp: item.otp,
    };
};

interface ServiceRequestStore {
    loading: boolean;
    requests: ServiceRequest[];
    startPolling: () => void;
    stopPolling: () => void;
    pollingInterval: NodeJS.Timeout | null;
    fetchRequests: (showLoader?: boolean) => Promise<void>;

    upcoming: () => ServiceRequest[];
    applied: () => ServiceRequest[];
    processing: () => ServiceRequest[];
    completed: () => ServiceRequest[];
    rejected: () => ServiceRequest[];

    accept: (requestId: string, shopId: string) => Promise<void>;
    reject: (requestId: string, shopId: string, reason: string) => Promise<void>;
    updateStatus: (payload: {
        request_id: string;
        shop_id: string;
        status: string;
        otp?: string;
        note?: string;
    }) => Promise<void>;

    updatePriceDetails: (payload: {
        request_id: string;
        shop_id: string;
        removed_fee_ids?: string[];
        custom_charges?: {
            id?: string;
            name: string;
            price: number
        }[];
    }) => Promise<void>;

    payment: (payload: {
        request_id: string;
        shop_id: string;
        payment_status: string;
        payment_mode: string;
        note?: string;
    }) => Promise<void>;

    updateLocalRequest: (requestId: string, updater: (req: ServiceRequest) => ServiceRequest) => void;
    addRequest: (request: ServiceRequest) => void;
    newRequestIds: Set<string>;
    optimisticIds: Set<string>;
    highlightedRequestId: string | null;
    setHighlightedRequestId: (id: string | null) => void;
    clearNewRequestId: (id: string) => void;
}

// Helper for robust deduplication across different sources (MQTT vs API)
// Uses customerPhone+service (most reliable) or customerName+service (fallback).
// Deliberately avoids date/time comparison since locale-formatted strings are brittle.
const isConceptualDuplicate = (a: ServiceRequest, b: ServiceRequest): boolean => {
    // 1. Exact ID match (cheapest check, do first)
    if (a.id === b.id) return true;

    // 2. Phone + service name — most reliable unique combo
    if (
        a.customerPhone &&
        b.customerPhone &&
        a.customerPhone === b.customerPhone &&
        a.serviceName === b.serviceName
    ) return true;

    // 3. Name + service name fallback (when phone is missing)
    if (
        a.customerName === b.customerName &&
        a.serviceName === b.serviceName &&
        a.requestedDate === b.requestedDate  // same calendar date is enough
    ) return true;

    return false;
};

export const useServiceRequestStore = create<ServiceRequestStore>((set, get) => ({
    loading: false,
    requests: [],
    pollingInterval: null,
    newRequestIds: new Set(),
    optimisticIds: new Set(),
    highlightedRequestId: null,

    addRequest: (request) => {
        set((state) => {
            // Strict ID check ONLY — conceptual matching is too risky here because
            // historical requests from the same customer/service would falsely match.
            // Conceptual matching happens only in fetchRequests where we compare
            // known-pending MQTT temp entries against fresh API results.
            if (state.requests.some(r => r.id === request.id)) {
                // Exact duplicate (e.g. MQTT delivered twice) — just re-trigger highlight
                return { highlightedRequestId: request.id };
            }

            const newIds = new Set(state.newRequestIds);
            newIds.add(request.id);

            return {
                requests: [request, ...state.requests],
                newRequestIds: newIds,
                highlightedRequestId: request.id
            };
        });
    },

    setHighlightedRequestId: (id) => set({ highlightedRequestId: id }),

    clearNewRequestId: (id) => {
        set((state) => {
            const newIds = new Set(state.newRequestIds);
            newIds.delete(id);
            return { newRequestIds: newIds };
        });
    },

    startPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) return;

        const interval = setInterval(() => {
            get().fetchRequests(false);
        }, 60000);

        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
            clearInterval(pollingInterval);
            set({ pollingInterval: null });
        }
    },

    fetchRequests: async (showLoader = true) => {
        const shouldShowLoader = showLoader && get().requests.length === 0;

        if (get().loading && shouldShowLoader) return;
        if (shouldShowLoader) set({ loading: true });

        try {
            const res = await api.get(ENDPOINTS.SERVICE_REQUEST.LIST, {
                params: { page: 1, limit: 1000 },
            });

            const items: RawServiceRequest[] = res.data.data?.items || [];
            const fetchedRequests = items.map(mapToUI);

            set((state) => {
                const pendingIds = new Set([...state.newRequestIds, ...state.optimisticIds]);
                const existingPendingRequests = state.requests.filter(r => pendingIds.has(r.id));

                const mergedRequests = [...fetchedRequests];
                const newOptimisticIds = new Set(state.optimisticIds);
                const newRequestIds = new Set(state.newRequestIds);
                // Track which real API ID should be highlighted after the merge
                let newHighlightId: string | null = null;

                existingPendingRequests.forEach(pendingReq => {
                    const matchIndex = mergedRequests.findIndex(r =>
                        r.id === pendingReq.id || isConceptualDuplicate(r, pendingReq)
                    );

                    if (matchIndex === -1) {
                        // Not on server yet — keep the in-memory (temp) entry at top
                        mergedRequests.unshift(pendingReq);
                    } else {
                        const realId = mergedRequests[matchIndex].id;

                        // Transfer "new" tracking from temp ID → real ID
                        if (newRequestIds.has(pendingReq.id)) {
                            newRequestIds.delete(pendingReq.id);
                            newRequestIds.add(realId);
                        }

                        // ALWAYS re-highlight the real entry when a temp entry is merged.
                        // This works even if the highlight timer already fired and cleared
                        // newRequestIds/highlightedRequestId before fetchRequests ran.
                        newHighlightId = realId;

                        newOptimisticIds.delete(pendingReq.id);
                    }
                });

                // Strict ID dedup — conceptual matching would risk merging distinct
                // real API records (e.g. same customer, same service, different day).
                const finalRequests = mergedRequests.filter((req, index, self) =>
                    index === self.findIndex((r) => r.id === req.id)
                );

                return {
                    requests: finalRequests,
                    optimisticIds: newOptimisticIds,
                    newRequestIds,
                    // Use the newly computed highlight; fall back to existing if no merge happened
                    highlightedRequestId: newHighlightId !== null ? newHighlightId : state.highlightedRequestId,
                    loading: false
                };
            });
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            set({ loading: false });
        }
    },

    upcoming: () => get().requests.filter((r) => r.status === 'upcoming' || r.status === 'pending'),
    applied: () => get().requests.filter((r) => r.status === 'applied'),
    processing: () => get().requests.filter((r) => r.status === 'active'),
    completed: () => get().requests.filter((r) => r.status === 'completed'),
    rejected: () => get().requests.filter((r) => r.status === 'rejected'),

    updateLocalRequest: (requestId: string, updater: (req: ServiceRequest) => ServiceRequest) => {
        set((state) => ({
            requests: state.requests.map((req) =>
                req.id === requestId ? updater(req) : req
            ),
        }));
    },

    accept: async (requestId, shopId) => {
        const originalRequests = get().requests;

        get().updateLocalRequest(requestId, (req) => ({
            ...req,
            status: 'pending',
            timeline: [
                ...(req.timeline || []),
                {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    title: 'Accepted',
                    description: 'Shop accepted the service request',
                    status: 'success',
                },
            ],
        }));

        try {
            set(state => ({ optimisticIds: new Set(state.optimisticIds).add(requestId) }));
            await api.post(ENDPOINTS.SERVICE_REQUEST.ACCEPT, { request_id: requestId, shop_id: shopId });
        } catch (err: any) {
            set(state => {
                const newOptimistic = new Set(state.optimisticIds);
                newOptimistic.delete(requestId);
                return { requests: originalRequests, optimisticIds: newOptimistic };
            });
            throw err;
        }
    },

    reject: async (requestId, shopId, reason) => {
        const originalRequests = get().requests;

        get().updateLocalRequest(requestId, (req) => ({
            ...req,
            status: 'rejected',
            rejectionReason: reason,
            timeline: [
                ...(req.timeline || []),
                {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    title: 'Rejected',
                    description: `Rejected: ${reason || 'No reason provided'}`,
                    status: 'error',
                },
            ],
        }));

        try {
            set(state => ({ optimisticIds: new Set(state.optimisticIds).add(requestId) }));
            await api.post(ENDPOINTS.SERVICE_REQUEST.REJECT, { request_id: requestId, shop_id: shopId, reason });
        } catch (err: any) {
            set(state => {
                const newOptimistic = new Set(state.optimisticIds);
                newOptimistic.delete(requestId);
                return { requests: originalRequests, optimisticIds: newOptimistic };
            });
            throw err;
        }
    },

    updateStatus: async (payload) => {
        const { request_id, status, note } = payload;
        const originalRequests = get().requests;
        get().updateLocalRequest(request_id, (req) => ({
            ...req,
            status: status as RequestStatus,
            timeline: [
                ...(req.timeline || []),
                {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    title: `Status updated`,
                    description: `Changed to ${status}${note ? ` - ${note}` : ''}`,
                    status: (status === 'completed' || status === 'applied') ? 'success' : 'info',
                },
            ],
            ...(status === 'completed' && { paymentCollected: true }),
        }));

        try {
            await api.put(ENDPOINTS.SERVICE_REQUEST.STATUS_UPDATE, payload);
        } catch (err: any) {
            console.error('[updateStatus] failed:', err);
            set({ requests: originalRequests });
            throw err;
        }
    },

    payment: async (payload) => {
        const { request_id } = payload;
        const originalRequests = get().requests;

        try {
            await api.put(ENDPOINTS.SERVICE_REQUEST.PAYMENT, payload);
            get().updateLocalRequest(request_id, (req) => ({
                ...req,
                payment_status: 'paid',
                paymentCollected: true,
                timeline: [
                    ...(req.timeline || []),
                    {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        title: 'Payment Collected',
                        description: `Cash collected - ${payload.note || ''}`,
                        status: 'success',
                    },
                ],
            }));
        } catch (err: any) {
            set({ requests: originalRequests });
            throw err;
        }
    },

    updatePriceDetails: async (payload) => {
        try {
            await api.patch(ENDPOINTS.SERVICE_REQUEST.PRICE_DETAILS, payload);
        } catch (err: any) {
            console.error('updatePriceDetails failed:', err);
            throw err;
        }
    },
}));


// MQTT Service
export const mapMqttToUI = (rawItem: any): ServiceRequest => {
    let data = rawItem;
    if (typeof rawItem === 'string') {
        try {
            data = JSON.parse(rawItem);
        } catch {
            data = rawItem;
        }
    }

    const innerData = data?.request_data ?? (data?.data ?? (data?.body ?? data));
    const date = data.timestamp ? new Date(data.timestamp) : (innerData.created_at ? new Date(innerData.created_at) : new Date());

    const userData = {
        id: innerData.customer?.id ?? (innerData.customer_id ?? (innerData.user_id ?? "")),
        name: innerData.customer?.name ?? (innerData.customerName ?? (innerData.name ?? (innerData.user_name ?? "Unknown"))),
        mobile_number: innerData.customer?.mobile_number ?? (innerData.customerPhone ?? (innerData.mobile_number ?? ""))
    };

    const serviceRaw = innerData.service;
    const service = {
        id: serviceRaw?.id ?? (innerData.service_id ?? crypto.randomUUID()),
        name: serviceRaw?.name ?? (innerData.serviceName ?? "Service"),
        description: serviceRaw?.description ?? (innerData.description ?? ""),
        total_price: Number(serviceRaw?.total_price ?? (innerData.total_price ?? 0)),
        service_fee: Number(serviceRaw?.service_fee ?? (innerData.total_service_fee ?? (innerData.service_fee_amount ?? 0)))
    };

    const serviceTypeRaw = innerData.service_type;
    const serviceType = {
        id: serviceTypeRaw?.id ?? "1",
        name: serviceTypeRaw?.name ?? "General"
    };

    const serviceData = {
        address: innerData.address ?? (innerData.location ?? ""),
        service: service,
        service_type: serviceType,
        service_fee: innerData.service_fee ?? (innerData.service_fees ?? [])
    };

    const shopData = {
        id: data.shopId ?? (innerData.shop_id ?? ""),
        name: data.shopName ?? (innerData.shop_name ?? ""),
        address: data.shopAddress ?? (innerData.shop_address ?? ""),
        mobile_number: ""
    };

    const requestId = data.requestId || (innerData.id || (innerData.request_id || (data.id || `${service.id}-${date.getTime()}`)));

    if (process.env.NODE_ENV !== 'production') {
        console.log(`🎯 [MQTT MAPPED ID]: ${requestId}`);
    }

    return {
        id: requestId,
        customerName: userData.name,
        customerPhone: userData.mobile_number,
        serviceName: service.name,
        serviceType: serviceType.name,
        serviceDetails: (service.description || "").replace(/<[^>]*>/g, ''),
        location: serviceData.address,

        requestedDate: date.toLocaleDateString(),
        requestedTime: date.toLocaleTimeString(),

        status: data.status || 'upcoming',
        priority: 'medium',

        amount: service.total_price,

        shopName: shopData.name,
        shopLocation: shopData.address,
        shopRating: 4.5,

        timeline: innerData.logs?.map((log: any) => ({
            id: log.id,
            timestamp: log.created_at,
            title: log.log.split(':')[0]?.trim() || 'Update',
            description: log.log,
            status: mapTimelineStatus(log.log),
        })) ?? [],

        priceDetails: [
            {
                id: `${service.id}-service-fee`,
                label: service.name,
                amount: service.service_fee,
                category: 'service',
                isMandatory: true,
                isCustom: false,
            },
            ...(serviceData.service_fee ?? []).map((fee: any) => {
                const isCustom = fee.is_mandatory === false && fee.active !== true;
                return {
                    id: fee.id || crypto.randomUUID(),
                    label: fee.name || "Additional Fee",
                    amount: Number(fee.price ?? (fee.charge ?? 0)),
                    category: 'additional' as const,
                    isMandatory: !isCustom,
                    isCustom,
                };
            }),
        ],

        payment_status: innerData.payment_status || 'pending',
        otp: innerData.otp || '',
    };
};