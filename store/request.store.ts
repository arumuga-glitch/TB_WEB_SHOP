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
}

export const useServiceRequestStore = create<ServiceRequestStore>((set, get) => ({
    loading: false,
    requests: [],
    pollingInterval: null,

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