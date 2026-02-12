"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui.store";

interface Props {
  open: boolean;
  onClose: () => void;
  chargeName: string;
  chargeAmount: string;
  setChargeName: (v: string) => void;
  setChargeAmount: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  isEditing: boolean;
}

export default function CustomChargeModal({
  open,
  onClose,
  chargeName,
  chargeAmount,
  setChargeName,
  setChargeAmount,
  onSubmit,
  loading,
  isEditing,
}: Props) {
  const { openModal, closeModal } = useUIStore();

  useEffect(() => {
    if (open) openModal();
    return () => closeModal();
  }, [open, openModal, closeModal]);

  if (!open) return null;

  return (
    <div className="modal fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Custom Charge" : "Add Custom Charge"}
        </h3>

        <input
          value={chargeName}
          onChange={(e) => setChargeName(e.target.value)}
          placeholder="Service Name"
          className="w-full border p-2 rounded mb-3"
        />

        <input
          value={chargeAmount}
          onChange={(e) => setChargeAmount(e.target.value)}
          placeholder="Amount"
          type="number"
          className="w-full border p-2 rounded mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : isEditing ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
