"use client";

import { useEffect, useState } from "react";
import { useServiceRequestStore } from "@/store/request.store";
import { useShopStore } from "@/store/shopStore";
import { ServiceRequest } from "@/types/myrequest";
import toast from "react-hot-toast";

import StatusFilterBar from "@/components/myrequests/StatusFilterBar";
import RequestList from "@/components/myrequests/RequestList";
import SearchBar from "@/components/myrequests/Searchbar";
import RequestDetailsPage from "@/components/myrequests/RequestDetailsSidebar";
import { useUIStore } from "@/store/ui.store";

export default function MyRequestsPage() {
  const {
    requests,
    loading,
    fetchRequests,
    accept,
    reject,
    startPolling,
    stopPolling,
    newRequestIds,
  } = useServiceRequestStore();

  const shopID = useShopStore((state) => state.shop?.id);

  // Handle polling and initial fetch
  useEffect(() => {
    if (!shopID) return; // wait until shop is loaded

    if (requests.length === 0) {
      // No data at all — show loader and fetch
      fetchRequests(shopID, true);
    } else if (newRequestIds.size === 0) {
      // We have data but no pending MQTT entries — safe to background-refresh
      fetchRequests(shopID, false);
    }
    // If newRequestIds.size > 0, skip fetch to avoid race-condition duplicates.
    // The polling interval will sync when MQTT entries are confirmed by the server.

    startPolling(shopID);

    return () => {
      stopPolling();
    };
  }, [shopID]); // re-run when shop becomes available


  const [filterStatus, setFilterStatus] = useState<
    ServiceRequest["status"] | "all" | "upcoming"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );
  const selectedRequest = requests.find(r => r.id === selectedId) || null;
  const [showDetails, setShowDetails] = useState(false);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);



  const filteredRequests = requests.filter((request) => {
    let matchesStatus = false;
    if (filterStatus === "all") {
      matchesStatus = true;
    } else if (filterStatus === "upcoming") {
      matchesStatus = request.status === "upcoming" || request.status === "pending";
    } else {
      matchesStatus = request.status === filterStatus;
    }

    const matchesSearch =
      searchQuery === "" ||
      request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customerPhone.includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;


  const currentRequests = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredRequests.length, totalPages, currentPage]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!shopID) {
      toast.error("Shop information not available");
      return;
    }

    try {
      await accept(requestId, shopID);
      toast.success("Request accepted. Now confirm to start processing.");
      // Delay sync to let server commit the status change, then replace temp MQTT entry
      setTimeout(() => shopID && fetchRequests(shopID, false), 1500);
    } catch (err) {
      toast.error("Failed to accept request");
      console.error(err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!shopID) {
      toast.error("Shop information not available");
      return;
    }

    const reason = prompt("Please enter rejection reason:");
    if (!reason || !reason.trim()) {
      toast.error("Rejection cancelled or no reason provided");
      return;
    }

    try {
      await reject(requestId, shopID, reason.trim());
      toast.success("Request rejected successfully");
      // Delay sync to let server commit the status change, then replace temp MQTT entry
      setTimeout(() => shopID && fetchRequests(shopID, false), 1500);
    } catch (err) {
      toast.error("Failed to reject request");
      console.error(err);
    }
  };

  const handleSelect = (id: string | null) => {
    if (id === null) {
      setSelectedId(null);
      setShowDetails(false);
      return;
    }

    if (selectedId === id) {
      return;
    }

    setSelectedId(id);
    if (window.innerWidth >= 1024) {
      setShowDetails(true);
    }
  };

  const handleCloseDetails = () => {
    setSelectedId(null);
    setShowDetails(false);
  };


  useEffect(() => {
    // Only run on desktop
    if (window.innerWidth < 1024) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.request-details-sidebar') ||
        target.closest('.request-card') ||
        target.closest('.modal')
      ) {
        return;
      }

      setShowDetails(false);
      setSelectedId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDetails]);

  const isModal = useUIStore((s) => s.isModalOpen);
  const isWide = typeof window !== "undefined" && window.innerWidth > 780;


  return (
    <div className="min-h-screen bg-slate-50  dark:bg-gray-900 px-4 pb-24 pt-4 sm:px-6">
      <header className="hidden sm:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Requests
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and track all your service requests
        </p>
      </header>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
      />

      <StatusFilterBar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setCurrentPage={setCurrentPage}
        requests={requests}
      />

      <div className={`relative grid gap-6 transition-all duration-300 ${showDetails ?
        "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
        }`}>
        <div
          className={`${showDetails ? "lg:col-span-2" : "lg:col-span-3"} ${isModal && isWide ? "z-[0]" : ""}`}>
          <RequestList
            currentRequests={currentRequests}
            loading={loading}
            selectedId={selectedId}
            setSelectedId={handleSelect}
            setShowDetails={setShowDetails}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            filteredRequestsLength={filteredRequests.length}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
        {selectedRequest && showDetails && (
          <RequestDetailsPage
            request={selectedRequest}
            setShowDetails={handleCloseDetails}
          />
        )}
      </div>
    </div >
  );
}