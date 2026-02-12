"use client";

import { canTransition } from "@/lib/requestGuard";
import { ServiceRequest } from "@/types/myrequest";

import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  request: ServiceRequest;
  onStatusChange: (status: "pending" | "rejected", reason?: string) => void;
}

export default function RequestActionFooter({
  request,
  onStatusChange,
}: Props) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (request.status !== "upcoming") return null;

  /* ACCEPT */
  const handleAccept = () => {
    if (!canTransition(request.status, "pending")) return;

    onStatusChange("pending");
    toast.success("Request accepted");
  };


  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter reject reason");
      return;
    }

    if (!canTransition(request.status, "rejected")) return;

    onStatusChange("rejected", rejectReason);
    setShowReject(false);
    setRejectReason("");
    toast.success("Request rejected");
  };

  return (
    <div className="border-t pt-4 space-y-3">

      {!showReject ? (
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg"
          >
            Accept
          </button>

          <button
            onClick={() => setShowReject(true)}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reject reason"
            className="w-full p-2 border rounded-lg text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg"
            >
              Confirm Reject
            </button>

            <button
              onClick={() => setShowReject(false)}
              className="flex-1 border py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
