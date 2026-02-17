"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { registerUserAndShop } from "@/lib/auth";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ENDPOINTS } from "@/lib/endpoints";

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: number;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
const generateSessionToken = () =>
  crypto?.randomUUID?.() ??
  `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobileFromOtp = searchParams.get("mobile") || "";
  const verifyId = searchParams.get("id") || "";
  const [sessionToken] = useState(generateSessionToken);
  const [form, setForm] = useState({
    user_name: "",
    user_email_id: "",
    shop_name: "",
    shop_address: "",
    shop_mobile_number: "",
    referral_code: "",
  });
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralError, setReferralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  /* ───────────────────── Referral Validation ───────────────────── */
  const validateReferral = useCallback(
    debounce(async (code: string) => {
      if (!code.trim()) {
        setReferralValid(null);
        setReferralError("");
        return;
      }
      try {
        const res = await fetch(ENDPOINTS.NEXT_API.REFERRAL_VALIDATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referral_code: code.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setReferralValid(true);
          setReferralError("");
          toast.success("Referral code applied!");
        } else {
          setReferralValid(false);
          setReferralError(data.message || "Invalid referral code");
        }
      } catch {
        setReferralValid(false);
        setReferralError("Failed to validate referral code");
      }
    }, 600),
    []
  );
  useEffect(() => {
    if (form.referral_code) {
      validateReferral(form.referral_code);
    } else {
      setReferralValid(null);
      setReferralError("");
    }
  }, [form.referral_code, validateReferral]);
  /* ───────────────────── Input Handlers ───────────────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  /* ───────────────────── Address Autocomplete (DEBOUNCED) ───────────────────── */
  const fetchAutocomplete = useCallback(
    debounce(async (query: string) => {
      if (query.length < 10) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const { data } = await api.get(ENDPOINTS.MAPS.PLACE, {
          params: {
            id: verifyId,
            query,
            session_token: sessionToken,
          },
        });
        const preds = data?.predictions || [];
        setSuggestions(preds);
        setShowSuggestions(preds.length > 0);
      } catch (err) {
        console.error("Autocomplete error:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500),
    [verifyId, sessionToken]
  );
  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, shop_address: value }));
    setShopLat(null);
    setShopLng(null);
    if (value.trim().length < 10) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetchAutocomplete(value.trim());
  };
  /* ───────────────────── Select Suggestion ───────────────────── */
  const selectSuggestion = async (item: any) => {
    const businessName = form.shop_name.trim();
    const baseAddress = item.description;
    const finalAddress = businessName
      ? `${businessName}, ${baseAddress}`
      : baseAddress;
    setForm(prev => ({ ...prev, shop_address: finalAddress }));
    setShowSuggestions(false);
    setSuggestions([]);
    try {
      const { data } = await api.get(ENDPOINTS.MAPS.GEOCODE, {
        params: {
          id: verifyId,
          address: baseAddress,
        },
      });
      const result = data?.results?.[0];
      const location = result?.geometry?.location;
      if (
        typeof location?.lat === "number" &&
        typeof location?.lng === "number"
      ) {
        setShopLat(location.lat);
        setShopLng(location.lng);
        toast.success("Valid shop address selected");
      } else {
        toast.error("Coordinates not found for this address");
      }
    } catch (err) {
      console.error("Geocode error:", err);
      toast.error("Failed to validate location");
    }
  };

  const isFormValid = () =>
    form.user_name.trim() &&
    form.user_email_id.includes("@") &&
    form.shop_name.trim() &&
    form.shop_address.trim() &&
    shopLat !== null &&
    shopLng !== null &&
    referralValid !== false;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Select a valid shop address from suggestions");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        user_name: form.user_name.trim(),
        user_mobile_number: mobileFromOtp,
        user_email_id: form.user_email_id.trim(),
        shop_name: form.shop_name.trim(),
        shop_mobile_number: mobileFromOtp,
        shop_address: form.shop_address.trim(),
        shop_latitude: shopLat!,
        shop_longitude: shopLng!,
        referral_code: form.referral_code.trim() || undefined,
      };
      const res = await registerUserAndShop(payload);

      const data = res.data ?? res;

      const accessToken =
        data.access_token || data.token;

      const user = data.user;

      if (!accessToken || !user) {
        throw new Error("Invalid authentication response");
      }

      useAuthStore
        .getState()
        .setAuth(user, accessToken);

      toast.success("Registration successful");
      router.replace("/dashboard");

    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-center">
          <img
            alt="Thendral Booking"
            width="140"
            height="40"
            decoding="async"
            className="h-10 w-auto"
            src="/logo.svg"
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="lg:flex lg:items-center lg:justify-center lg:min-h-[calc(100vh-64px)] lg:py-8">
        <div className="w-full lg:max-w-4xl xl:max-w-5xl">
          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-8">
            <img
              alt="Thendral Booking"
              width="180"
              height="60"
              decoding="async"
              className="h-16 mx-auto mb-4"
              src="/logo.svg"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Registration
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Fill in your details to complete registration
            </p>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 lg:bg-white lg:dark:bg-gray-800 lg:rounded-xl lg:shadow-lg lg:border lg:border-gray-200 lg:dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                {/* Left Column - Personal Information */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                      Personal Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          name="user_name"
                          value={form.user_name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm sm:text-base"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          name="user_email_id"
                          type="email"
                          value={form.user_email_id}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm sm:text-base"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Registered Mobile
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                            +91
                          </div>
                          <input
                            value={mobileFromOtp}
                            disabled
                            className="w-full pl-14 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300 cursor-not-allowed text-sm sm:text-base"
                          />
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          This is your login mobile number
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column - Shop Information */}
                <div className="space-y-6 mt-6 lg:mt-0">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                      Shop Information
                    </h2>
                    <div className="space-y-4">
                      {/* Shop Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Shop Name *
                        </label>
                        <input
                          name="shop_name"
                          value={form.shop_name}
                          onChange={handleChange}
                          placeholder="Enter shop/business name"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm sm:text-base"
                          disabled={isLoading}
                        />
                      </div>
                      {/* Shop Address - now with validation via suggestions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Shop Address * (select from suggestions)
                        </label>
                        <div className="relative">
                          <textarea
                            name="shop_address"
                            value={form.shop_address}
                            onChange={handleAddressChange}
                            placeholder="Start typing your shop address..."
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none min-h-[120px] text-sm sm:text-base"
                            disabled={isLoading}
                            rows={4}
                          />
                          {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {suggestions.map((item, index) => (
                                <li
                                  key={index}
                                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                  onClick={() => selectSuggestion(item)}
                                >
                                  <div className="font-medium">
                                    {form.shop_name || "Shop"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.description}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          You must select a valid address from the suggestions (Google Maps verified)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Validation status - shows if valid address selected */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-sm space-y-2">
                  {/* existing checks */}
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${shopLat !== null && shopLng !== null ? "bg-green-500" : "bg-gray-300"
                        }`}
                    ></div>
                    <span
                      className={
                        shopLat !== null && shopLng !== null
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400"
                      }
                    >
                      Valid shop address selected from map {shopLat !== null ? "✓" : ""}
                    </span>
                  </div>
                </div>
              </div>
              {/* Submit Button */}
              <div className="pt-2 lg:pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-medium transition-all
                ${!isLoading && isFormValid()
                      ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  All fields marked with * are required • Shop address must be selected from suggestions
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}