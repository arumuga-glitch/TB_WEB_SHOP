'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useShopStore } from '@/store/shopStore';

import { DesktopSidebar } from '@/components/dashboard/DesktopSidebar';
import { DesktopHeader, HeaderUserData } from '@/components/dashboard/DesktopHeader';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import DisclaimerDialog from '@/components/dashboard/Disclaimer';
import AgreementDialog from '@/components/dashboard/Agreement';
import MqttRequestListener from '@/components/common/MqttRequestListener';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const { shop, fetchShopByUser, toggleOnline, toggleLoading } = useShopStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState<HeaderUserData | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [shopLoaded, setShopLoaded] = useState(false);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const isOnline = shop?.is_online ?? false;

  const toggleNotifications = () => setShowNotifications((v) => !v);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      router.replace("/");
    }
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    // 1. If no user or no token yet, don't fetch
    if (!user?.id || !accessToken) return;

    // 2. Only fetch if we don't have a shop OR if the current shop belongs to a different user
    // This prevents infinite loops if fetchShopByUser is called repeatedly
    if (!shop || shop.user?.id !== user.id) {
      if (shopLoaded) return; // Prevent multiple simultaneous attempts

      console.log("🏪 Dashboard fetching shop for user:", user.id);
      fetchShopByUser(user.id).finally(() => {
        setShopLoaded(true);
      });
    } else {
      setShopLoaded(true);
    }
  }, [user?.id, accessToken, shop, shopLoaded, fetchShopByUser]);

  useEffect(() => {
    if (!hydrated) return;

    const accepted = localStorage.getItem("thendral_disclaimer_accepted");

    if (!accepted) {
      setShowDisclaimer(true);
    }

    setDisclaimerChecked(true);
  }, [hydrated]);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("thendral_disclaimer_accepted", "true");
    setShowDisclaimer(false);
  };

  // Sequence logic: Disclaimer -> Agreement -> Dashboard
  useEffect(() => {
    if (!disclaimerChecked) return;

    // 1. If disclaimer not accepted, don't show agreement yet
    if (showDisclaimer) {
      setShowAgreement(false);
      return;
    }

    // 2. If disclaimer accepted, check if shop needs to sign agreement
    if (shop && !shop.service_agreement) {
      setShowAgreement(true);
    } else {
      setShowAgreement(false);
    }
  }, [disclaimerChecked, showDisclaimer, shop]);

  useEffect(() => {
    if (!user) return;

    setUserData({
      name: user.name || 'User',
      email: user.email_id || 'no-email',
      shop_name: shop?.name,
      shop_location: shop?.address,
      avatarInitial: (user.name?.charAt(0) || 'U').toUpperCase(),
    });
  }, [user, shop]);


  if (!accessToken || !hydrated) return null;

  // ─── STEP 1: Show Disclaimer ───
  if (showDisclaimer) {
    return (
      <DisclaimerDialog onAccept={handleAcceptDisclaimer} />
    );
  }

  // ─── STEP 2: Show Agreement (only if not signed) ───
  if (showAgreement && shop) {
    return (
      <AgreementDialog onAccept={() => setShowAgreement(false)} />
    );
  }

  // ─── STEP 3: Show Dashboard ───
  if (!shop) return null;


  return (
    <div className="min-h-screen bg-slate-50 sm:bg-white dark:bg-gray-900/95">

      <MobileHeader
        isOnline={isOnline}
        toggleOnlineStatus={toggleOnline}
        userData={userData}
      />

      <DesktopSidebar handleLogout={logout} />

      <DesktopHeader
        showNotifications={showNotifications}
        toggleNotifications={toggleNotifications}
        isOnline={isOnline}
        toggleOnlineStatus={toggleOnline}
        toggleLoading={toggleLoading}
        userData={userData}
      />

      <main className="lg:ml-64 min-h-screen bg-slate-50 dark:bg-gray-900 rounded-lg">
        <div className="lg:mt-20 lg:p-8">
          {shop ? children : (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />

      {/* ── Real-time MQTT new-request listener & alert popup ── */}
      {isOnline && <MqttRequestListener />}
    </div>
  );
}