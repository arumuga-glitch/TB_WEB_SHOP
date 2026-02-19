"use client";

import { ServiceRequest } from "@/types/myrequest";
import RequestCard from "./RequestCard";
import { useEffect, useRef, useState } from "react";

interface RequestListProps {
  currentRequests: ServiceRequest[];
  loading: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setShowDetails: (show: boolean) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  filteredRequestsLength: number;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
}

export default function RequestList({
  currentRequests,
  loading,
  selectedId,
  setSelectedId,
  setShowDetails,
  onAccept,
  onReject,
  currentPage,
  totalPages,
  setCurrentPage,
  filteredRequestsLength,
  itemsPerPage,
  setItemsPerPage,
}: RequestListProps) {
  const [isMobile, setIsMobile] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setItemsPerPage(filteredRequestsLength);
      setCurrentPage(1);
    }
  }, [isMobile, filteredRequestsLength, setItemsPerPage, setCurrentPage]);

  useEffect(() => {
    if (isMobile) {
      setVisibleCount(3);
    }
  }, [currentRequests, isMobile]);

  useEffect(() => {
    if (!isMobile || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          visibleCount < currentRequests.length
        ) {
          setVisibleCount((prev) =>
            Math.min(prev + 3, currentRequests.length)
          );
        }
      },
      {
        root: null,
        rootMargin: "150px",
        threshold: 0.1,
      }
    );

    const element = loadMoreRef.current;
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [isMobile, visibleCount, currentRequests.length]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Loading your requests...
        </p>
      </div>
    );
  }

  const visibleRequests = isMobile
    ? currentRequests.slice(0, visibleCount)
    : currentRequests;

  return (
    <div className="space-y-6">
      <div className="sm:bg-white dark:bg-gray-800 sm:rounded-xl sm:shadow-sm overflow-hidden sm:border sm:border-gray-200 dark:border-gray-700 sm:p-4">
        {filteredRequestsLength === 0 ? (
          <div className="p-12 text-center">
            <div className="text-7xl text-gray-300 dark:text-gray-600 mb-5">
              📭
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
              No requests found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              No requests match your current filters or search.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
              {visibleRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedId === request.id}
                  onSelect={() => {
                    setSelectedId(request.id);
                    setShowDetails(true);
                  }}
                  onAccept={onAccept}
                  onReject={onReject}
                />
              ))}
            </div>

            {isMobile && visibleCount < currentRequests.length && (
              <div
                ref={loadMoreRef}
                className="flex justify-center py-6 text-sm text-gray-500"
              >
                Loading more...
              </div>
            )}

            {isMobile && visibleCount >= currentRequests.length && (
              <div className="flex justify-center py-6 text-sm text-gray-400">
                No more requests
              </div>
            )}
          </>
        )}
      </div>

      {!isMobile && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      )}
    </div>
  );
}

/* -------------------- Pagination Component -------------------- */

function PaginationControls({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            ‹
          </button>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
