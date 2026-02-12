"use client";

import { ServiceRequest } from "@/types/myrequest";
import { useEffect } from "react";
import { FiClock, FiCheck, FiX } from "react-icons/fi";

interface StatusFilterBarProps {
  filterStatus: ServiceRequest["status"] | "all" | "pending";
  setFilterStatus: (status: ServiceRequest["status"] | "all" | "pending") => void;
  setCurrentPage: (page: number) => void;
  requests: ServiceRequest[];
}

export default function StatusFilterBar({
  filterStatus,
  setFilterStatus,
  setCurrentPage,
  requests,
}: StatusFilterBarProps) {

  const statusCounts = {
    all: requests.length,
    upcoming: requests.filter((r) => r.status === "upcoming").length,
    pending: requests.filter((r) => r.status === "pending").length,
    active: requests.filter((r) => r.status === "active").length,
    applied: requests.filter((r) => r.status === "applied").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  // "Upcoming" tab shows count of upcoming + pending
  const upcomingGroupCount = statusCounts.upcoming + statusCounts.pending;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;

      if (isMobile && filterStatus === "all") {
        setFilterStatus("upcoming");
        setCurrentPage(1);
      }
    }
  }, []);


  return (
    <div>
      <div className="mb-4">

        {/* 🔹 MOBILE VERSION */}
        <div className="md:hidden space-y-3">

          {/* Top Group */}
          <div className="bg-white dark:bg-gray-800 p-1 rounded-2xl flex">
            {["upcoming", "active", "applied"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition ${filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                {status === "upcoming" && "Upcoming"}
                {status === "active" && "In Processing"}
                {status === "applied" && "Applied"}
              </button>
            ))}
          </div>

          {/* Bottom Group */}
          <div className="bg-white dark:bg-gray-800 p-1 rounded-2xl flex">
            {["rejected", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition ${filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                {status === "rejected" && "Rejected"}
                {status === "completed" && "Completed"}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* desktop view */}
      <div className=" hidden md:block mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {(
              ["all", "upcoming", "active", "applied", "completed", "rejected"] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {status === "all" && `All (${statusCounts.all})`}

                {status === "upcoming" && (
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" /> Upcoming (
                    {upcomingGroupCount})
                  </div>
                )}
                {status === "active" && `Processing (${statusCounts.active})`}

                {status === "applied" && `Applied (${statusCounts.applied})`}

                {status === "completed" && (
                  <div className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4" /> Completed (
                    {statusCounts.completed})
                  </div>
                )}

                {status === "rejected" && (
                  <div className="flex items-center gap-2">
                    <FiX className="w-4 h-4" /> Rejected ({statusCounts.rejected})
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile search - placeholder */}
        <div className="sm:hidden">
          <div className="relative">
            {/* ... mobile search input if you want to add later ... */}
          </div>
        </div>
      </div>
    </div>
  );
}