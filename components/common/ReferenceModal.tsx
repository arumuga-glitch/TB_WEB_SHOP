"use client";

import { useUIStore } from "@/store/ui.store";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

interface Props {
  open: boolean;
  onCancel: () => void;
  onClose: () => void;
  onConfirm: (refId: string) => Promise<void>;
  title?: string;
  placeholder?: string;
  showCloseButton?: boolean;
}

export function ReferenceIdModal({
  open,
  onCancel,
  onConfirm,
  title = "Update Status",
  placeholder = "Reference Number",
  showCloseButton = true,
}: Props) {
  const [refId, setRefId] = useState("");
  const { openModal, closeModal } = useUIStore();

  useEffect(() => {
    if (open) openModal();
    return () => closeModal();
  }, [open, openModal, closeModal]);

  if (!open) return null;


  const handleSubmit = async () => {
    if (!refId.trim()) {
      toast.error("Enter reference number");
      return;
    }

    try {
      await onConfirm(refId.trim());
      toast.success("Reference added successfully");
      setRefId("");
      onCancel();
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center md:p-4 modal">

      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 ">

        {/* Header */}
        <div className="relative p-5 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold pr-8">{title}</h3>

          {showCloseButton && (
            <button
              onClick={onCancel}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="p-5">
          <input
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="w-full border px-4 py-3 rounded-lg  bg-transparent"
          />

          <p className="text-xs text-gray-500 mt-3">
            Press Enter to submit or click Submit
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-5 border-t dark:border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!refId.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>

      {/* ================= MOBILE MODAL ================= */}
      <div className="md:hidden z-[9999] absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl animate-slideUp">

        {/* Drag Handle */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>

          {showCloseButton && (
            <button
              onClick={onCancel}
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-2"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="p-4">
          <input
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="w-full border border-gray-300 px-4 py-3 rounded-xl bg-transparent"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!refId.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}