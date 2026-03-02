"use client";

import { useUIStore } from "@/store/ui.store";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

interface Props {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export default function RejectReasonModal({
  open,
  onClose,
  onCancel,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { openModal, closeModal } = useUIStore();

  useEffect(() => {
    if (open) openModal();
    return () => closeModal();
  }, [open, openModal, closeModal]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      toast.error("Failed to reject request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bottom-18 md:bottom-0 bg-black/40 overscroll-none flex items-end md:items-center justify-center modal">

      {/* ================= MOBILE BOTTOM SHEET ================= */}
      <div className="md:hidden w-full bg-white dark:bg-gray-800 rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-200 ">

        {/* Drag Handle */}
        <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reject Request</h3>
          <button onClick={onClose} aria-label="Close">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason..."
          className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-gray-500 outline-none mb-4"
          disabled={loading}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Submit
          </button>
        </div>
      </div>

      {/* ================= DESKTOP MODAL ================= */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative ">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl"
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="text-xl font-semibold mb-5 pr-8">
          Reject Request
        </h3>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for rejection..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 min-h-[110px] text-sm focus:ring-2 focus:ring-red-500 outline-none"
          disabled={loading}
        />

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
          >
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}