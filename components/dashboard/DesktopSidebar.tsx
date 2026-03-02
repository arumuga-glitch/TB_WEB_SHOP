"use client";

import { useRouter, usePathname } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { SidebarIcon } from "../ui/SidebarIcon";

interface NavigationItem {
  icon: {
    default: string;
    active: string;
  };
  label: string;
  path: string;
}


interface DesktopSidebarProps {
  handleLogout: () => void;
}

export function DesktopSidebar({ handleLogout }: DesktopSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      icon: {
        default: "/assets/icons/ic_nav_home.svg",
        active: "/assets/icons/ic_nav_home_active.svg",
      },
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: {
        default: "/assets/icons/ic_nav_news.svg",
        active: "/assets/icons/ic_nav_news_active.svg",
      },
      label: "News",
      path: "/dashboard/news",
    },
    {
      icon: {
        default: "/assets/icons/ic_nav_request.svg",
        active: "/assets/icons/ic_nav_request_active.svg",
      },
      label: "Requests",
      path: "/dashboard/requests",
    },
    {
      icon: {
        default: "/assets/icons/ic_nav_profile.svg",
        active: "/assets/icons/ic_nav_profile_active.svg",
      },
      label: "Settings",
      path: "/dashboard/settings",
    },
  ];


  return (
    <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white dark:bg-black  dark:border-gray-700">
      <div className="p-6 h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-left mb-8">
          <SidebarIcon
            alt="Thendral Booking"
            width={160}
            height={48}
            className="h-12 w-auto"
            src="/assets/images/img_logo_splash.png"
            priority={true}
            loading="eager"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 mt-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                <SidebarIcon
                  src={item.icon.default}
                  activeSrc={item.icon.active}
                  isActive={isActive}
                  size={25}
                  alt={item.label}
                  className="dark:brightness-250"
                />

                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}