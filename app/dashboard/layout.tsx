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
    if (!user?.id || shopLoaded) return;

    fetchShopByUser(user.id);
    setShopLoaded(true);
  }, [user?.id, shopLoaded, fetchShopByUser]);

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

  useEffect(() => {
    if (!disclaimerChecked) return;
    if (showDisclaimer) return;
    if (!shop) return;
    setShowAgreement(false);
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

  if (showDisclaimer) {
    return (
      <DisclaimerDialog onAccept={handleAcceptDisclaimer} />
    );
  }

  if (showAgreement) {
    return (
      <AgreementDialog onAccept={() => setShowAgreement(false)} />
    );
  }

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
        <div className="lg:mt-20 lg:p-8">{children}</div>
      </main>

      <MobileBottomNav />
    </div>
  );
}