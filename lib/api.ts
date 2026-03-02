import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { ShopData } from "@/store/shopStore";
import { NewsResponse } from "@/types/news";
import { ENDPOINTS, AUTH_FREE_ROUTES } from "@/lib/endpoints";


export interface ReferralResponse {
  success: string;
  message: string;
  data: string;
}


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let queue: ((token: string | null) => void)[] = [];
let refreshRetryCount = 0;
const MAX_REFRESH_RETRIES = 2;

const resolveQueue = (token: string | null) => {
  queue.forEach(cb => cb(token));
  queue = [];
};

api.interceptors.request.use((config) => {
  const isAuthFree = AUTH_FREE_ROUTES.some(route =>
    config.url?.includes(route)
  );

  if (!isAuthFree) {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    delete config.headers.Authorization;
  }

  return config;
});


api.interceptors.response.use(
  (res) => {
    // Reset retry count on any successful response
    if (!AUTH_FREE_ROUTES.some(route => res.config.url?.includes(route))) {
      refreshRetryCount = 0;
    }
    return res;
  },
  async (error) => {
    const original = error.config;

    // Handle 401 Unauthorized
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !AUTH_FREE_ROUTES.some(route => original.url?.includes(route))
    ) {
      // If we are already refreshing, just queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      // Check max retries only when STARTING a new refresh session
      if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        console.error("❌ Max token refresh retries reached. Logging out...");
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.replace("/");
        return Promise.reject(error);
      }

      original._retry = true;
      isRefreshing = true;
      refreshRetryCount++;

      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const refreshPath = ENDPOINTS.AUTH.REFRESH_TOKEN.replace(/^\//, "");
        const refreshUrl = `${apiUrl}/${refreshPath}`;

        console.warn(`🔄 Refreshing access token (Attempt ${refreshRetryCount})...`);

        const store = useAuthStore.getState();
        const storedRefreshToken = store.refreshToken;

        const res = await axios.post(
          refreshUrl,
          {
            refresh_token: storedRefreshToken,
            refreshToken: storedRefreshToken
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              ...(storedRefreshToken ? { Authorization: `Bearer ${storedRefreshToken}` } : {})
            }
          }
        );

        const body = res.data ?? {};
        const payload = body.data ?? body;
        const newToken = payload.access_token ?? payload.token ?? payload.accessToken;
        const newRefreshToken = payload.refresh_token ?? payload.refreshToken ?? null;

        if (!newToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        store.setToken(newToken, newRefreshToken);

        isRefreshing = false;
        resolveQueue(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        // Important: reset retry count on successful refresh result
        refreshRetryCount = 0;

        return api(original);
      } catch (refreshError: any) {
        console.error("❌ Refresh token failed", refreshError);
        isRefreshing = false;
        resolveQueue(null);

        // Treat 400, 401, or 403 as session death for the refresh endpoint
        const failureStatus = refreshError.response?.status;
        if ([400, 401, 403].includes(failureStatus)) {
          console.error("🚪 Refresh token rejected. Logging out...");
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") window.location.replace("/");
        }

        return Promise.reject(refreshError);
      }
    }

    // If it WAS a retry and it still failed with 401, that's also a logout (Session died during retry)
    if (error.response?.status === 401 && original?._retry) {
      console.error("🚪 Retry failed with 401. Force logout for URL:", original.url);
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.replace("/");
    }

    return Promise.reject(error);
  }
);

export default api;

// Settings Page Enpoints

export async function generateReferralCode(): Promise<string> {
  const { data: response } = await api.post<ReferralResponse>(ENDPOINTS.REFERRAL.GENERATE_CODE, {
    referrer_type: "SHOP",
  });

  if (!response?.success || !response.data || typeof response.data !== "string") {
    const msg = response?.message || "No valid referral code returned";
    throw new Error(msg);
  }

  return response.data;
}

export async function validateReferralCode(code: string): Promise<{ valid: boolean; message?: string }> {
  const { data } = await api.post(ENDPOINTS.REFERRAL.VALIDATE, {
    referral_code: code.trim(),
  });
  return data;
}

// Shop

export const getShopByUser = async (userId: string): Promise<ShopData> => {
  const { data } = await api.get(ENDPOINTS.SHOP.BY_USER(userId));

  if (!data?.success) {
    throw new Error(data?.message || "Failed to fetch shop details");
  }

  const shop = data.data;

  return {
    id: shop.id,
    shop_id: shop.shop_id,
    name: shop.name,
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    wallet_amount: shop.wallet_amount,
    active: shop.active,
    is_online: shop.is_online,
    service_agreement: shop.service_agreement,
    created_at: shop.created_at,
    updated_at: shop.updated_at,
    user: {
      id: shop.user.id,
      name: shop.user.name,
    },
  };
};

export const toggleShopOnline = async (
  shopId: string,
  payload: { is_online: boolean }
) => {
  const { data } = await api.put(
    ENDPOINTS.SHOP.TOGGLE_ONLINE(shopId),
    payload
  );
  return data;
};



export const updateShop = async (shopId: string, payload: any) => {
  const { data } = await api.put(ENDPOINTS.SHOP.UPDATE(shopId), payload);
  return data;
};

export const updateUser = async (userId: string, payload: { name: string; email_id: string }) => {
  const { data } = await api.put(ENDPOINTS.USER.UPDATE(userId), payload);
  return data;
};

// FCM Token Registration
export interface FcmTokenPayload {
  fcm_token?: string;
  web_fcm_token?: string;
}

export const updateFcmToken = async (payload: FcmTokenPayload) => {
  const { data } = await api.put(ENDPOINTS.USER.FCM_TOKEN, payload);
  return data;
};

// Maps

export const reverseGeocode = async (id: string, lat: number, lng: number) => {
  try {
    const { data } = await api.get(ENDPOINTS.MAPS.GEOCODE, {
      params: { id, latlng: `${lat},${lng}` },
    });
    return data;
  } catch (error: any) {
    console.error("Reverse geocode error:", error);
    throw new Error(error.response?.data?.message || "Failed to get address from location");
  }
};

// Dashboard API

export const getDashboardStats = async (shopId: string) => {
  try {
    const { data } = await api.get(ENDPOINTS.SERVICE_REQUEST.DASHBOARD(shopId));
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch dashboard details");
  }
};


// News

export const getNewsList = async (): Promise<NewsResponse> => {
  const { data } = await api.get(ENDPOINTS.NEWS.LIST);
  if (!data?.success) {
    throw new Error(data?.message || "Failed to fetch news list");
  }
  return data;
};



export const uploadServiceAgreement = async (
  shopId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("service_agreement", file);

  const { data } = await api.post(
    ENDPOINTS.SHOP.UPLOAD_SERVICE_AGREEMENT(shopId),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Failed to upload agreement");
  }

  return data;
};
