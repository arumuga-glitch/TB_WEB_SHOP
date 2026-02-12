"use client";

import { useRouter, usePathname } from "next/navigation";
import { SidebarIcon } from "../ui/SidebarIcon";
export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { icon: {default:"/assets/icons/ic_nav_home.svg",active:"/assets/icons/ic_nav_home_active.svg"}, label: "Dashboard", path: "/dashboard" },
    { icon: {default:"/assets/icons/ic_nav_news.svg",active:"/assets/icons/ic_nav_news_active.svg"}, label: "News", path: "/dashboard/news" },
    { icon: {default:"/assets/icons/ic_nav_request.svg",active:"/assets/icons/ic_nav_request_active.svg"}, label: "Requests", path: "/dashboard/requests" },
    { icon: {default:"/assets/icons/ic_nav_profile.svg",active:"/assets/icons/ic_nav_profile_active.svg"}, label: "Profile", path: "/dashboard/settings" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item, idx) => {
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <button
              key={idx}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center p-2 flex-1 ${isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
                }`}
            >
              <SidebarIcon 
              src={isActive ? item.icon.active : item.icon.default}
              size={24}
              alt={item.label}
              className="dark:brightness-400"
              />
             
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}

      </div>
    </nav>
  );
}