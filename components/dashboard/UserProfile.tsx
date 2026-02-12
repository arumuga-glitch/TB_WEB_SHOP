"use client";

import { HeaderUserData } from "./DesktopHeader";
import { SidebarIcon } from "../ui/SidebarIcon";

interface UserProfileProps {
  isOnline: boolean;
  toggleOnlineStatus: (next: boolean) => void;
  loading: boolean;
  userData: HeaderUserData | null;
  icon?: {
    default: string;
  };
}

export function UserProfile({
  isOnline,
  toggleOnlineStatus,
  loading,
  userData,
}: UserProfileProps) {
  return (
    <div className="flex items-center space-x-6">
      {/* Shop Location */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <SidebarIcon
          src="/assets/icons/ic_location.svg"
          size={20}
          alt="Location Icon"
        />
        {userData?.shop_location ? (
          <span
            className="max-w-[120px] truncate cursor-help"
            title={userData.shop_location}
          >
            {userData.shop_location.slice(0, 14)}
            {userData.shop_location.length > 12 && "..."}
          </span>
        ) : (
          <span>Location unavailable</span>
        )}
      </div>

      {/* Toggle + Profile */}
      <div className="flex items-center space-x-3">
        {/* ONLINE / OFFLINE ICON TOGGLE */}
        <button
          type="button"
          disabled={loading}
          onClick={() => toggleOnlineStatus(!isOnline)}
          aria-label={isOnline ? "Go offline" : "Go online"}
          title={isOnline ? "Go offline" : "Go online"}
          className={`transition-opacity ${
            loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <SidebarIcon
            src={
              isOnline
                ? "/assets/icons/ic_online.svg"
                : "/assets/icons/ic_offline.svg"
            }
            size={30}
            alt={isOnline ? "Online" : "Offline"}
            className={
              isOnline
                ? "text-green-500 dark:text-green-400"
                : "text-gray-400 dark:text-gray-500"
            }
          />
        </button>

        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-semibold text-base">
                {userData?.avatarInitial || "U"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">
                {userData?.name || "User"}
              </span>
              <span
                className={`text-xs ${
                  isOnline
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
