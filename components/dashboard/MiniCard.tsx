"use client";
import { SidebarIcon } from "../ui/SidebarIcon";
interface MiniCardProps {
  title: string;
  value: number | string;
  icon: {
    default: string;
  };
  isLoading?: boolean;
}

export function MiniCard({ title, value, icon, isLoading }: MiniCardProps) {

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      {/* Mobile Layout */}
      <div className="flex flex-col items-center text-center  sm:hidden p-4" >
        <SidebarIcon src={icon.default} size={40} alt={title} />

        <span className={`text-2xl font-bold text-blue-600 dark:text-white mt-2 ${isLoading ? "animate-pulse" : ""}`}>
          {value}
        </span>

        <p className="text-sm font-medium  dark:text-gray-300 mt-1">
          {title}
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex flex-col">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-8">
          {title}
        </p>

        <div className="flex justify-between items-end sm:gap-4">
          <SidebarIcon
            src={icon.default}
            size={60}
            alt={title}
            className="mt-4"
          />
          <span className={`text-xl font-bold text-gray-900 dark:text-white ${isLoading ? "animate-pulse" : ""}`}>
            {value}
          </span>
        </div>
      </div>

    </div>
  );
}

