"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useShopStore } from "@/store/shopStore";
import { generateReferralCode, reverseGeocode, updateShop, updateUser } from "@/lib/api";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  FiSun,
  FiMoon,
  FiCopy,
  FiMail,
  FiUser,
  FiMapPin,
  FiHome,
  FiShare2,
  FiCheck,
  FiSave,
  FiLoader,
  FiGlobe,
  FiPhone,
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { SidebarIcon } from "@/components/ui/SidebarIcon";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: number;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

const generateSessionToken = () =>
  crypto?.randomUUID?.() ?? `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { shop, fetchShopByUser, setShop } = useShopStore();

  const [sessionToken] = useState(generateSessionToken);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    shop_address: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();

  const [referralCode, setReferralCode] = useState<string>("");
  const [loadingReferralCode, setLoadingReferralCode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);


  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email_id || "",
        shop_address: shop?.address || "",
      });
      if (user.id && !shop) {
        fetchShopByUser(user.id);
      }
    }
  }, [user, shop, fetchShopByUser]);

  useEffect(() => {
    if (shop) {
      setForm((prev) => ({ ...prev, shop_address: shop.address || "" }));
      setLat(shop.latitude ?? null);
      setLng(shop.longitude ?? null);
    }
  }, [shop]);

  useEffect(() => {
    if (user && shop) {
      const nameChanged = form.name !== user.name;
      const emailChanged = form.email !== user.email_id;
      const addressChanged = form.shop_address !== shop.address;
      const coordsChanged = lat !== shop.latitude || lng !== shop.longitude;
      setHasChanges(nameChanged || emailChanged || addressChanged || coordsChanged);
    }
  }, [form, lat, lng, user, shop]);

  useEffect(() => {
    const loadReferralCode = async () => {
      if (!user?.id) return;

      setLoadingReferralCode(true);
      try {
        const code = await generateReferralCode();
        setReferralCode(code);
      } catch (err) {
        console.error("Failed to load referral code:", err);
        toast.error("Could not load referral code");
        setReferralCode("");
      } finally {
        setLoadingReferralCode(false);
      }
    };

    if (user?.id) {
      loadReferralCode();
    }
  }, [user?.id]);

  const fetchAutocomplete = useCallback(
    debounce(async (query: string) => {
      if (!user?.id) return;

      const { data } = await api.get(ENDPOINTS.MAPS.PLACE, {
        params: {
          id: user.id,
          query,
          session_token: sessionToken,
        },
      });

      const preds = data?.predictions || [];
      setSuggestions(preds);
      setShowSuggestions(preds.length > 0);
    }, 500),
    [sessionToken, user?.id],
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, shop_address: value }));
    setLat(null);
    setLng(null);

    if (value.trim().length < 10) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetchAutocomplete(value.trim());
  };

  const selectSuggestion = async (item: any) => {
    const baseAddress = item.description;
    setForm((prev) => ({ ...prev, shop_address: baseAddress }));
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const { data } = await api.get(ENDPOINTS.MAPS.GEOCODE, {
        params: { id: user?.id, address: baseAddress },
      });
      const loc = data?.results?.[0]?.geometry?.location;
      if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
        setLat(loc.lat);
        setLng(loc.lng);
        toast.success("✓ Location coordinates confirmed");
      }
    } catch (err) {
      toast.error("Could not get coordinates");
    }
  };


  const detectCurrentLocation = () => {
    if (!navigator.geolocation || !user?.id) {
      toast.error("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const data = await reverseGeocode(user?.id, latitude, longitude);

          const address =
            data?.results?.[0]?.formatted_address || "";

          if (!address) {
            toast.error("Unable to detect address");
            return;
          }

          setForm((prev) => ({
            ...prev,
            shop_address: address,
          }));

          setLat(latitude);
          setLng(longitude);

          setSuggestions([]);
          setShowSuggestions(false);

          toast.success("✓ Location detected");
        } catch (err: any) {
          toast.error(err.message || "Failed to fetch address");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);

        if (error.code === 1) {
          toast.error("Location permission denied");
        } else {
          toast.error("Unable to detect location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_REFERRAL_URL}/${referralCode}`
    : "";

  const referralMessage = referralCode
    ? `Join me on Thendral Booking! Use my referral code: ${referralCode}\nOr click this link: ${referralLink}`
    : "";

  const copyCodeToClipboard = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopySuccess(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleNativeShare = async () => {
    if (!referralCode) return;

    const shareData = {
      title: "Join Thendral Booking",
      text: referralMessage,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralMessage);
      toast("Link copied to clipboard (native share not supported)", {
        icon: "📋",
        duration: 5000,
      });
    } catch (err) {
      toast.error("Could not copy message");
    }
  };


  const handleSave = async () => {
    if (!user || !shop) {
      toast.error("No user/shop data found");
      return;
    }

    if (form.shop_address !== shop.address && (lat === null || lng === null)) {
      toast.error("Please select a valid shop address");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Update user
      await updateUser(user.id, {
        name: form.name,
        email_id: form.email,
      });

      // 2️⃣ Update shop
      await updateShop(shop.id, {
        name: shop.name,
        address: form.shop_address,
        latitude: lat ?? shop.latitude,
        longitude: lng ?? shop.longitude,
      });
      useAuthStore.setState({
        user: { ...user, name: form.name, email_id: form.email },
      });

      setShop({
        ...shop,
        address: form.shop_address,
        latitude: lat ?? shop.latitude,
        longitude: lng ?? shop.longitude,
      });

      setHasChanges(false);

      toast.success("✓ Settings updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Please login first</p>
        </div>
      </div>
    );
  }
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const handlelogout = () => {
    logout();
    router.push("/login");
  }

  const renderDesktopLayout = () => (
    <>
      <div className="hidden md:block max-w-5xl py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <FiGlobe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Light or dark mode</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleTheme}
                aria-label={resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {resolvedTheme === "light" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5 text-yellow-500" />}
              </Button>
            </div>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Personal Information</h3>
            </CardHeader>

            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                    <div className={`flex items-center gap-1 ${user.mobile_verified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {user.mobile_verified ? (
                        <>
                          <SidebarIcon src="/assets/icons/ic_verified.svg" size={20} alt="Verified" />
                          <span className="text-xs font-medium">Verified</span>
                        </>
                      ) : (
                        <>
                          <SidebarIcon src="/assets/icons/ic_not_verified.svg" size={20} alt="Unverified" />
                          <span className="text-xs font-medium">Unverified</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Input
                    value={user.mobile_number}
                    disabled
                    leftIcon={<FiPhone className="w-4 h-4" />}
                    className="bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                  />
                  {!user.mobile_verified && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Mobile number verification required for full access
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <div className={`flex items-center gap-1 ${user.email_verified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {user.email_verified ? (
                      <>
                        <SidebarIcon src="/assets/icons/ic_verified.svg" size={20} alt="Verified" />
                        <span className="text-xs font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <SidebarIcon src="/assets/icons/ic_not_verified.svg" size={18} alt="Unverified" />
                        <span className="text-xs font-medium">Unverified</span>
                      </>
                    )}
                  </div>
                </div>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  error={!user.email_verified ? "Please verify your email for important notifications" : undefined}
                />
              </div>
            </CardBody>
          </Card>

          {/* Shop Information */}
          <Card>
            <CardHeader className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FiHome className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Shop Information</h3>
            </CardHeader>

            <CardBody>
              <div className="space-y-2">
                <Textarea
                  label="Shop Address"
                  value={form.shop_address}
                  onChange={handleAddressChange}
                  placeholder="Start typing your shop address... (minimum 10 characters)"
                  rows={3}
                  className="resize-none"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item, i) => (
                      <div
                        key={i}
                        className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                        onClick={() => selectSuggestion(item)}
                      >
                        <div className="flex items-start gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{item.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lat !== null && lng !== null && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <FiCheck className="w-4 h-4" />
                    <span>Location coordinates captured</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Referral Section */}
          <Card>
            <CardHeader>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Referral</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Invite friends and grow together
              </p>
            </CardHeader>

            <CardBody className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Code</span>
                  {referralCode && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg min-w-0">
                    {loadingReferralCode ? (
                      <div className="flex items-center gap-2">
                        <FiLoader className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Loading...</span>
                      </div>
                    ) : referralCode ? (
                      <code className="font-mono text-gray-900 dark:text-white text-base font-semibold break-all">
                        {referralCode}
                      </code>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Not available</span>
                    )}
                  </div>

                  {referralCode && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        onClick={copyCodeToClipboard}
                        title="Copy referral code"
                      >
                        {copySuccess ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                      </Button>

                      <Button
                        onClick={handleNativeShare}
                        title="Share via WhatsApp, Telegram, Email..."
                        disabled={loadingReferralCode}
                      >
                        <FiShare2 className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {referralCode && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Tap share icon to send via WhatsApp, Telegram, Email, etc.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Support */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiMail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Support</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Need help? Contact our support team</p>
                </div>
              </div>

              <Button
                variant="secondary"
                leftIcon={<FiMail className="w-4 h-4" />}
                onClick={() => window.open("https://mail.google.com/mail/?view=cm&fs=1&to=support@thendralbooking.com&su=Help%20Needed%20from%20Dashboard", "_blank")}
              >
                Contact Support
              </Button>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Save Changes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hasChanges ? "You have unsaved changes" : "All changes saved"}
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  loading={loading}
                  variant="success"
                  leftIcon={<FiSave className="w-4 h-4" />}
                  className="min-w-[120px]"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )



  // Mobile Layout
  const renderMobileLayout = () => (
    <div className="md:hidden dark:bg-gray-900 min-h-screen px-4 pt-2 pb-24">

      {!isEditing ? (
        <>
          {/* ================= PROFILE CARD ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center justify-between bg-gradient-to-r from-blue-0 to-blue-100 dark:to-blue-900">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl font-bold dark:text-white ">
                {form.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {form.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600"
            >
              ✏️
            </button>
          </div>


          {/* ================= INFO CARD ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 ">

            <MobileRow
              label="Mobile number"
              value={user?.mobile_number}
              rightElement={
                user?.mobile_verified ? (
                  <SidebarIcon
                    src="/assets/icons/ic_verified.svg"
                    size={22}
                    alt="Back"
                  />
                ) : (
                  <SidebarIcon
                    src="/assets/icons/ic_not_verified.svg"
                    size={22}
                    alt="Back"
                  />
                )
              }
            />

            <MobileRow
              label="Email Id"
              value={form.email}
              rightElement={
                user?.email_verified ? (
                  <SidebarIcon
                    src="/assets/icons/ic_verified.svg"
                    size={22}
                    alt="Back"
                  />
                ) : (
                  <SidebarIcon
                    src="/assets/icons/ic_not_verified.svg"
                    size={22}
                    alt="Back"
                  />
                )
              }
            />

            <MobileRow
              label="Shop Address"
              value={form.shop_address}
            />
          </div>


          {/* ================= REFERRAL CARD ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center justify-between ">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Referral Code
              </p>
              <p className="text-sm font-medium  mt-1 tracking-widest text-gray-900 dark:text-white">
                {referralCode || "Loading..."}
              </p>
            </div>

            <button
              onClick={handleNativeShare}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
            >
              <FiShare2 />
            </button>
          </div>


          {/* ================= THEME CARD ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiSun className="text-gray-500" />
              <span className="text-sm font-medium">App Theme</span>
            </div>

            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${resolvedTheme === "dark"
                ? "bg-blue-600"
                : "bg-gray-300"
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${resolvedTheme === "dark"
                  ? "translate-x-6"
                  : "translate-x-0"
                  }`}
              />
            </button>
          </div>


          {/* ================= SUPPORT CARD ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Email Us for Help & Support
            </p>
            <a
              href="mailto:support@thendralbooking.com"
              className="text-sm text-gray-500 font-medium"
            >
              support@thendralbooking.com
            </a>
          </div>


          {/* ================= LOGOUT ================= */}
          <button
            onClick={handlelogout}
            className="w-full py-3 rounded-2xl border border-red-500 text-red-600 font-medium bg-white dark:bg-gray-800"
          >
            Logout
          </button>
        </>
      ) : (
        /* ===== MOBILE EDIT MODE ===== */
        <div className="min-h-screen dark:bg-gray-900 px-4 pt-6 pb-24 z-[9999]">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setIsEditing(false)}>
              <SidebarIcon
                src="/assets/icons/ic_back_arrow.svg"
                size={22}
                alt="Back"
              />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Profile Edit
            </h1>
          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 px-4 py-3 text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email Id
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 px-4 py-3 text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="relative">

              <label className=" flex  justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Shop Address
                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={loading}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <SidebarIcon
                    src="/assets/icons/ic_gps.svg"
                    size={22}
                    alt="Detect Location"
                  />
                </button>

              </label>

              <textarea
                value={form.shop_address}
                onChange={handleAddressChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 px-4 py-3 text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => selectSuggestion(item)}
                      className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {item.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                await handleSave();
                setIsEditing(false);
              }}
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 
      text-white font-medium py-3 rounded-xl 
      transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>

      )}
    </div>
  );




  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      {/* Desktop view */}
      <div className="hidden md:block">
        {renderDesktopLayout()}
      </div>
      {/* Mobile View */}
      <div className="md:hidden">
        {renderMobileLayout()}
      </div>

    </div>
  );
}



export function MobileRow({
  icon,
  label,
  value,
  rightElement,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 pr-4  border-b border-gray-200  dark:border-gray-700 ">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-500">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          {value && (
            <p className="text-xs text-gray-500 dark:text-white line-clamp-3">
              {value}
            </p>
          )}
        </div>
      </div>
      {rightElement}
    </div>
  );
}
