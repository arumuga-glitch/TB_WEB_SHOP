"use client";

import { useUIStore } from "@/store/ui.store";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  correctOtp?: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function VerifyOTPModal({
  open,
  correctOtp,
  onCancel,
  onConfirm,
}: Props) {
  const [otp, setOtp] = useState("");
  const { openModal, closeModal } = useUIStore();

  useEffect(() => {
    if (open) openModal();
    return () => closeModal();
  }, [open, openModal, closeModal]);

  if (!open) return null;

  const handleVerify = async () => {
    if (!otp.trim()) {
      toast.error("Enter OTP");
      return;
    }

    if (otp !== correctOtp) {
      toast.error("Invalid OTP. Try again");
      return;
    }

    await onConfirm();
    toast.success("OTP verified");
    setOtp("");
  };

  return (

    <>
      <div className="min-h-screen hidden md:flex fixed inset-0 z-[9999] bg-black/40 items-center justify-center modal">  
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-4">
            Verify OTP
          </h3>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full border rounded p-2 mb-4"
          />

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 border py-2 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              className="flex-1 bg-blue-600 text-white py-2 rounded cursor-pointer"
            >
              Verify
            </button>
          </div>
        </div>
      </div>

      {/* mobile version */}
      <div className="fixed inset-0 z-[9999] bottom-16  sm:hidden modal">  {/* ADDED: modal class */}
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onCancel}
        />

        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl animate-slideUp">

          {/* Drag Handle */}
          <div className="flex justify-center pt-2">
            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">Update Status</h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">

            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
              maxLength={6}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
            />

            <p className="text-right text-sm text-gray-500">
              {otp.length}/6
            </p>

            <button
              onClick={handleVerify}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Submit
            </button>

          </div>
        </div>
      </div>

    </>

  );
}