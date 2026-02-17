
import { AuthResponse } from "@/types/auth";
import api from "./api";
import { ENDPOINTS } from "@/lib/endpoints";

export const sendOtp = async (
  mobile: string
): Promise<{ isNewUser: boolean }> => {
  try {
    const res = await api.post(ENDPOINTS.AUTH.SEND_OTP, {
      mobile_number: mobile,
    });

    if (res.data.success === true) {
      return { isNewUser: false };
    }

    if (
      res.data.success === false &&
      res.data.message?.toLowerCase().includes("register")
    ) {
      await api.post(ENDPOINTS.AUTH.REGISTER_SEND_OTP, {
        mobile_number: mobile,
      });
      return { isNewUser: true };
    }

    throw new Error(res.data.message || "Failed to send OTP");
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Failed to send OTP");
  }
};

export const verifyOtpSmart = async (
  mobile: string,
  otp: string,
  isNewUser: boolean
): Promise<AuthResponse> => {
  const endpoint = isNewUser
    ? ENDPOINTS.AUTH.REGISTER_VERIFY_OTP
    : ENDPOINTS.AUTH.VERIFY_OTP;

  try {
    const res = await api.post(endpoint, {
      mobile_number: mobile,
      otp,
    });

    const body = res.data ?? {};
    const payload = body.data ?? body;

    if (body.success !== true) {
      throw new Error(body.message || "Verification failed");
    }

    if (isNewUser) {
      return {
        isNewUser: true,
        id: payload.id || payload.user?.id || null,
        user: null,
        accessToken: undefined,
        expiresIn: undefined,
        tokenType: "Bearer",
      };
    }

    const user = payload.user ?? payload.user_data ?? null;
    const accessToken = payload.access_token ?? payload.token ?? null;

    if (!user || !accessToken) {
      throw new Error("Incomplete authentication data");
    }

    return {
      isNewUser: false,
      user,
      accessToken,
      expiresIn: payload.expires_in ?? null,
      tokenType: payload.token_type ?? "Bearer",
    };
  } catch (err: any) {
    const msg = (err.response?.data?.message ?? err.message ?? "").toLowerCase();

    if (msg.includes("expired")) {
      throw new Error("OTP Expired");
    }

    if (msg.includes("invalid") || msg.includes("wrong")) {
      throw new Error("Invalid OTP");
    }

    console.log("OTP verification failed. Please try again.");
    throw new Error(err.response?.data?.message || "OTP verification failed");
  }
};

export interface RegisterUserShopPayload {
  user_name: string;
  user_mobile_number: string;
  user_email_id: string;
  shop_name: string;
  shop_mobile_number: string;
  shop_address: string;
  shop_latitude: number;
  shop_longitude: number;
  referral_code?: string;
}

export const registerUserAndShop = async (payload: RegisterUserShopPayload) => {
  try {
    const res = await api.post(ENDPOINTS.AUTH.REGISTER_USER_SHOP, payload);
    const data = res.data;

    if (!data?.success) {
      const message = data?.message || "Registration failed - server rejected the request";
      throw new Error(message);
    }
    if (!data.user && !data.data?.user) {
      console.warn("Registration succeeded but no user data returned");
    }

    return data;
  } catch (err: any) {
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw err;
  }
};