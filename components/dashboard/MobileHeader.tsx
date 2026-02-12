"use client";

import { useState } from "react";
import { HeaderUserData } from "./DesktopHeader";
import { SidebarIcon } from "../ui/SidebarIcon";
import { usePathname } from "next/navigation";

interface MobileHeaderProps {
  isOnline: boolean;
  toggleOnlineStatus: (next: boolean) => void;
  userData: HeaderUserData | null;
  loading?: boolean;
}

export function MobileHeader({
  isOnline,
  toggleOnlineStatus,
  userData,
  loading = false,
}: MobileHeaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const pathname = usePathname();

  const handleConfirm = () => {
    toggleOnlineStatus(!isOnline);
    setShowConfirm(false);
  };

  const isDashboard = pathname === "/dashboard";

  if (!isDashboard) return null;

  return (
    <>
      <header className="lg:hidden fixed top-2 left-2 right-2 z-50 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl ">
        
        <div className="flex justify-between items-center px-4 py-5">
          
          {/* Shop Details */}
          <div className="flex flex-col leading-tight max-w-[280px] truncate ">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Hi {userData?.shop_name || "Shop"},
            </span>

            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center mt-1 line-clamp-2">
              <SidebarIcon
                src="/assets/icons/ic_location.svg"
                size={16}
                alt="Location Icon"
                className="mr-1"
              />
              {userData?.shop_location || "Location unavailable"}
            </span>
          </div>

          {/* Online Toggle */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowConfirm(true)}
            aria-label={isOnline ? "Go offline" : "Go online"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all
              ${
                isOnline
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900/30"
              }
              ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <SidebarIcon
              src={
                isOnline
                  ? "/assets/icons/ic_online.svg"
                  : "/assets/icons/ic_offline.svg"
              }
              size={18}
              alt={isOnline ? "Online" : "Offline"}
            />

            <span
              className={`text-xs font-medium ${
                isOnline
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </button>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 mb-16 z-50 bg-black/50 flex items-end md:hidden">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg animate-in slide-in-from-bottom duration-200">
            
            <div className="relative flex justify-center items-center p-5 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Shop Status
              </h3>

              <button
                onClick={() => setShowConfirm(false)}
                className="absolute right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <SidebarIcon
                  src="/assets/icons/ic_close.svg"
                  size={20}
                  alt="Close"
                />
              </button>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to{" "}
                <span className="font-medium">
                  {isOnline ? "go offline" : "go online"}
                </span>
                ?
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800">
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
