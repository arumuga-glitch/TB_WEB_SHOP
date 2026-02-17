"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MiniCard } from "@/components/dashboard/MiniCard";
import { useShopStore } from "@/store/shopStore";
import { dashboardend } from "@/lib/api";

interface DashboardStats {
  status_counts: {
    pending: number;
    active: number;
    applied: number;
    completed: number;
  };
  total_earnings: number;
}

export default function DashboardPage() {
  const { shop, loading: shopLoading } = useShopStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);


  useEffect(() => {
    if (!shop?.id) return;

    const fetchDashboard = async () => {
      setStatsLoading(true);
      try {
        const res = await dashboardend(shop.id);
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboard();
  }, [shop?.id]);

  if (shopLoading || !shop?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading shop information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 
                      sm:mt-2  
                      pb-24 sm:pb-6">

        {/* Mobile view */}
        <div className="pt-28 sm:hidden mb-6">
          <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-100 to-blue-200 
                  dark:from-blue-900/40 dark:to-blue-900/40
                  border border-blue-200 dark:border-blue-800 shadow-sm">

            <div className="flex items-center justify-between">

              {/* Wallet */}
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹ {(shop?.wallet_amount ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Wallet Amount
                </p>
              </div>

              {/* Earnings */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹ {(stats?.total_earnings ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Earnings
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ✅ DESKTOP VERSION (unchanged) */}
        <div className="hidden sm:grid grid-cols-2 gap-4 mb-6 ">
          <DashboardCard
            title="Wallet Balance"
            value={`₹ ${(shop?.wallet_amount ?? 0).toLocaleString()}`}
            icon={{ default: "/assets/images/img_wallet.svg" }}
          />

          <DashboardCard
            title="Total Earnings"
            value={`₹ ${(stats?.total_earnings ?? 0).toLocaleString()}`}
            icon={{ default: "/assets/images/img_rupee.svg" }}
          />
        </div>


        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
          My Requests
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniCard
            title="Upcoming"
            value={stats?.status_counts.pending ?? 0}
            icon={{ default: "/assets/images/img_upcoming.svg" }}
          />
          <MiniCard
            title="Processing"
            value={stats?.status_counts.active ?? 0}
            icon={{ default: "/assets/images/img_in_progress.svg" }}
          />
          <MiniCard
            title="Applied"
            value={stats?.status_counts.applied ?? 0}
            icon={{ default: "/assets/images/img_processing.svg" }}
          />
          <MiniCard
            title="Completed"
            value={stats?.status_counts.completed ?? 0}
            icon={{ default: "/assets/images/img_done.svg" }}
          />
        </div>
      </div>
    </div>
  );
}
