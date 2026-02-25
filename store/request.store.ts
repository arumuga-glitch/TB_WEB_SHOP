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
        serviceType: item.service_data.service_type!.name,
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
            // 1️⃣ Service Fee (simple, direct)
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
}

export const useServiceRequestStore = create<ServiceRequestStore>((set, get) => ({
    loading: false,
    requests: [],
    pollingInterval: null,

    addRequest: (request) => {
        set((state) => {
            // Check for duplicates to avoid double-adding if API refresh happens simultaneously
            if (state.requests.some(r => r.id === request.id)) return state;
            return { requests: [request, ...state.requests] };
        });
    },

    startPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) return;

        const interval = setInterval(() => {
            get().fetchRequests(false);
        }, 60000); // Poll every 60 seconds for faster updates

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
        if (get().loading && showLoader) return;

        if (showLoader) set({ loading: true });

        try {
            const res = await api.get(ENDPOINTS.SERVICE_REQUEST.LIST, {
                params: { page: 1, limit: 1000 },
            });

            const items: RawServiceRequest[] = res.data.data?.items || [];
            set({ requests: items.map(mapToUI) });
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        } finally {
            if (showLoader) set({ loading: false });
        }
    },


    upcoming: () => get().requests.filter((r) => r.status === 'upcoming'),
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
            status: 'active',
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
            await api.post(ENDPOINTS.SERVICE_REQUEST.ACCEPT, { request_id: requestId, shop_id: shopId });
        } catch (err: any) {
            console.error('Accept failed:', err);
            set({ requests: originalRequests });
            throw err;
        }
    },

    reject: async (requestId, shopId, reason) => {
        const originalRequests = get().requests;

        // Optimistic
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
            await api.post(ENDPOINTS.SERVICE_REQUEST.REJECT, { request_id: requestId, shop_id: shopId, reason });
        } catch (err: any) {
            set({ requests: originalRequests });
            throw err;
        }
    },

    updateStatus: async (payload) => {
        const { request_id, status, note, otp } = payload;
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
                    status: status === 'completed' || status === 'applied' ? 'success' : 'info',
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
    // 1. Normalize the entry point
    let data = rawItem;

    // Handle stringified payloads
    if (typeof rawItem === 'string') {
        try {
            data = JSON.parse(rawItem);
        } catch {
            data = rawItem;
        }
    }

    // Capture the internal data block (many systems wrap the actual request in 'request_data' or 'data')
    const innerData = data?.request_data ?? (data?.data ?? (data?.body ?? data));

    if (process.env.NODE_ENV !== 'production') {
        console.log("🚀 [MQTT STORE] Incoming Raw Payload:", data);
        console.log("📦 [MQTT STORE] Extracted Inner Data:", innerData);
    }

    // 2. Standardize fields
    const date = data.timestamp ? new Date(data.timestamp) : (innerData.created_at ? new Date(innerData.created_at) : new Date());

    // User Data Extraction
    const userData = {
        id: innerData.customer?.id ?? (innerData.customer_id ?? (innerData.user_id ?? "")),
        name: innerData.customer?.name ?? (innerData.customerName ?? (innerData.name ?? (innerData.user_name ?? "Unknown"))),
        mobile_number: innerData.customer?.mobile_number ?? (innerData.customerPhone ?? (innerData.mobile_number ?? ""))
    };

    // Service Extraction
    const serviceRaw = innerData.service;
    const service = {
        id: serviceRaw?.id ?? (innerData.service_id ?? crypto.randomUUID()),
        name: serviceRaw?.name ?? (innerData.serviceName ?? "Service"),
        description: serviceRaw?.description ?? (innerData.description ?? ""),
        total_price: Number(serviceRaw?.total_price ?? (innerData.total_price ?? 0)),
        service_fee: Number(serviceRaw?.service_fee ?? (innerData.total_service_fee ?? (innerData.service_fee_amount ?? 0)))
    };

    // Service Category/Type Extraction
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

    if (process.env.NODE_ENV !== 'production') {
        console.log("🎯 [MQTT STORE] Final Mapped Components:", { userData, service, serviceType, shopData });
    }

    // 3. Map to final UI structure
    const requestId = data.requestId || (innerData.id || (innerData.request_id || `${service.id}-${date.getTime()}`));

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
            // 1️⃣ Service Fee
            {
                id: `${service.id}-service-fee`,
                label: service.name,
                amount: service.service_fee,
                category: 'service',
                isMandatory: true,
                isCustom: false,
            },

            // 2️⃣ Platform / additional fees
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