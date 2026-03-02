
export const ENDPOINTS = {
    AUTH: {
        SEND_OTP: "/auth/send-otp",
        REGISTER_SEND_OTP: "/auth/register-send-otp",
        VERIFY_OTP: "/auth/verify-otp",
        REGISTER_VERIFY_OTP: "/auth/register-verify-otp",
        REFRESH_TOKEN: "/auth/refresh-token",
        REGISTER_USER_SHOP: "/auth/register-user-shop",
    },

    USER: {
        UPDATE: (userId: string) => `/user/update/${userId}`,
        FCM_TOKEN: "/user/fcm-token",
    },

    SHOP: {
        BY_USER: (userId: string) => `/shop/by-user/${userId}`,
        UPDATE: (shopId: string) => `/shop/update/${shopId}`,
        TOGGLE_ONLINE: (shopId: string) => `/shop/online/${shopId}`,
        UPLOAD_SERVICE_AGREEMENT: (shopId: string) => `/shop/upload-service-agreement/${shopId}`,
    },

    REFERRAL: {
        GENERATE_CODE: "/referral/generate-code",
        VALIDATE: "/referral/validate",
    },

    MAPS: {
        PLACE: "/maps/place",
        GEOCODE: "/maps/geocode",
    },

    SERVICE_REQUEST: {
        LIST: (shopId: string) => `/service-request/list?shop_id=${shopId}`,
        ACCEPT: "/service-request/accept",
        REJECT: "/service-request/reject",
        STATUS_UPDATE: "/service-request/shop/status-update",
        PAYMENT: "/service-request/shop/payment",
        PRICE_DETAILS: "/service-request/shop/price-details",
        DASHBOARD: (shopId: string) => `/service-request/shop/dashboard/${shopId}`,
    },

    NEWS: {
        LIST: "/news/list",
    },
    NEXT_API: {
        REFERRAL_VALIDATE: "/api/referral/validate",
    },
} as const;

// Auth-free routes
export const AUTH_FREE_ROUTES = [
    ENDPOINTS.AUTH.SEND_OTP,
    ENDPOINTS.AUTH.REGISTER_SEND_OTP,
    ENDPOINTS.AUTH.VERIFY_OTP,
    ENDPOINTS.AUTH.REGISTER_VERIFY_OTP,
    ENDPOINTS.AUTH.REFRESH_TOKEN,
    ENDPOINTS.AUTH.REGISTER_USER_SHOP,
] as const;
