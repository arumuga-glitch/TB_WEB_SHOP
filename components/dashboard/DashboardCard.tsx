"use client";

import { SidebarIcon } from "../ui/SidebarIcon";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: {
    default: string;
  };
}

export function DashboardCard({
  title,
  value,
  icon,
}: DashboardCardProps) {
  return (
    <>
      <div className="sm:hidden rounded-2xl p-5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border border-blue-200 dark:border-blue-800 shadow-sm ">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {title}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ DESKTOP VERSION (unchanged layout) */}
      <div className="hidden sm:flex p-6 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 shadow-sm flex-col hover:bg-gray-50 dark:hover:bg-gray-800 transition mt-10">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {title}
        </p>

        <div className="flex justify-between items-end">
          <SidebarIcon
            src={icon.default}
            size={48}
            alt={title}
            className="dark:invert"
          />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </>
  );
}
