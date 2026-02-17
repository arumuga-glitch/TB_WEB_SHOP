"use client";

import { useUIStore } from "@/store/ui.store";
import { UserProfile } from "./UserProfile";
export interface HeaderUserData {
  name: string;
  avatarInitial: string;
  email?: string;
  shop_name?: string;
  shop_location?: string;
}

interface DesktopHeaderProps {
  showNotifications: boolean;
  toggleNotifications: () => void;
  isOnline: boolean;
  toggleOnlineStatus: (nextStatus: boolean) => void;
  toggleLoading: boolean;
  userData: HeaderUserData | null;
}

export function DesktopHeader({
  isOnline,
  toggleOnlineStatus,
  toggleLoading,
  userData,
}: DesktopHeaderProps) {
  const isModalOpen = useUIStore((s) => s.isModalOpen);
  return (
    <header
      className={`hidden lg:block fixed top-0 right-0 left-64 
    bg-white/95 dark:bg-black backdrop-blur-sm dark:border-gray-700
    transition-all duration-200 
    ${isModalOpen ? " z-[10] pointer-events-none" : "z-[9999]"}
  `}
    >

      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          {userData?.shop_name ? (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate max-w-[240px]">
              {userData.shop_name}
            </h1>
          ) : (
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Dashboard
            </div>
          )}
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-6">
          {/* <Notifications
            showNotifications={showNotifications}
            toggleNotifications={toggleNotifications}
          /> */}

          <UserProfile
            isOnline={isOnline}
            toggleOnlineStatus={toggleOnlineStatus}
            loading={toggleLoading}
            userData={userData}
          />
        </div>
      </div>
    </header>
  );
}