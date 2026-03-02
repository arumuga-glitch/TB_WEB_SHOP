"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MiniCard } from "@/components/dashboard/MiniCard";
import { useShopStore } from "@/store/shopStore";
import { useAuthStore } from "@/store/authStore";
import { getDashboardStats } from "@/lib/api";

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
  const { shop, loading: shopLoading, fetchShopByUser } = useShopStore();
  const userId = useAuthStore((s) => s.user?.id);

  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchShopByUser(userId);
    }
  }, [userId, fetchShopByUser]);

  useEffect(() => {
    if (!shop?.id) return;

    const fetchDashboard = async () => {
      setStatsLoading(true);
      try {
        const res = await getDashboardStats(shop.id);
        // Robust extraction from { success: true, data: { ... } } or { status_counts: ... }
        const statsData = res?.data ?? res;
        setStats(statsData);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboard();
  }, [shop?.id]);

  // Safe accessor helper for nested or flat status counts
  const getCount = (key: string) => {
    if (!stats || statsLoading) return 0;

    // Use statsData directly or status_counts nested object
    const counts = stats.status_counts || stats.counts || stats;

    // Helper for case-insensitive and varying key lookup (handles objects and arrays)
    const findValue = (k: string) => {
      const lowerK = k.toLowerCase();

      if (Array.isArray(counts)) {
        const item = counts.find(i =>
          (i.status?.toLowerCase() === lowerK) ||
          (i.name?.toLowerCase() === lowerK) ||
          (i.key?.toLowerCase() === lowerK)
        );
        return item ? Number(item.count ?? item.value ?? 0) : 0;
      }

      const found = Object.keys(counts).find(ck => ck.toLowerCase() === lowerK);
      return found ? Number(counts[found]) : 0;
    };

    if (key === 'pending') {
      return findValue('pending') + findValue('upcoming');
    }

    if (key === 'active') {
      return findValue('active') + findValue('processing') + findValue('in_progress');
    }

    return findValue(key);
  };

  const totalEarnings = statsLoading ? null : (stats?.total_earnings ?? stats?.earnings ?? stats?.total_earning ?? 0);

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
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
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${statsLoading ? 'animate-pulse' : ''}`}>
                  ₹ {totalEarnings !== null ? Number(totalEarnings).toLocaleString() : '...'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Earnings
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:grid grid-cols-2 gap-4 mb-6 ">
          <DashboardCard
            title="Wallet Balance"
            value={`₹ ${(shop?.wallet_amount ?? 0).toLocaleString()}`}
            icon={{ default: "/assets/images/img_wallet.svg" }}
          />

          <DashboardCard
            title="Total Earnings"
            value={statsLoading ? '...' : `₹ ${Number(totalEarnings ?? 0).toLocaleString()}`}
            icon={{ default: "/assets/images/img_rupee.svg" }}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Requests</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MiniCard
            title="Upcoming"
            value={statsLoading ? '...' : getCount('pending')}
            isLoading={statsLoading}
            icon={{ default: "/assets/images/img_upcoming.svg" }}
          />
          <MiniCard
            title="Processing"
            value={statsLoading ? '...' : getCount('active')}
            isLoading={statsLoading}
            icon={{ default: "/assets/images/img_in_progress.svg" }}
          />
          <MiniCard
            title="Applied"
            value={statsLoading ? '...' : getCount('applied')}
            isLoading={statsLoading}
            icon={{ default: "/assets/images/img_processing.svg" }}
          />
          <MiniCard
            title="Completed"
            value={statsLoading ? '...' : getCount('completed')}
            isLoading={statsLoading}
            icon={{ default: "/assets/images/img_done.svg" }}
          />
        </div>
      </div>
    </div>
  );
}
