"use client";

import { useUIStore } from "@/store/ui.store";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface Props {
  open: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  rejectText?: string;
  onClose: () => void;
  onReject: () => void;
  onConfirm: () => void;
  showCloseButton?: boolean;
  variant?: "default" | "danger";
}

export default function ConfirmStatusModal({
  open,
  title = "Confirm Status Change",
  description,
  confirmText = "Confirm",
  rejectText = "Reject",
  onClose,
  onReject,
  onConfirm,
  showCloseButton = true,
  variant = "default",
}: Props) {
  const { openModal, closeModal } = useUIStore();

  useEffect(() => {
    if (open) {
      openModal();
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
    return () => {
      closeModal();
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  }, [open, openModal, closeModal]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 overscroll-none modal">
      {/* Desktop Version */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="relative p-5 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
            {title}
          </h3>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description */}
        <div className="p-5">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-5 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">

          {/* Reject Button */}
          <button
            onClick={onReject}
            className={`flex-1 py-2.5 px-4 font-medium rounded-lg transition-colors ${variant === "danger"
              ? "border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
          >
            {rejectText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all ${variant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {confirmText}
          </button>

        </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl animate-slideUp">

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-white px-2">
            {description}
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onReject}
              className="flex-1 py-3 rounded-xl border border-red-500 text-red-500 font-medium"
            >
              {rejectText}
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}