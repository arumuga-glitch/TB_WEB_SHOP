"use client";

import { ServiceRequest } from "@/types/myrequest";
import { FiUser, FiClock, FiCheckCircle, FiInfo, FiFileText, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import RequestActionFooter from "./RequestActionFooter";
import toast from "react-hot-toast";
import { useShopStore } from "@/store/shopStore";
import { useServiceRequestStore } from "@/store/request.store";
import { useEffect, useState } from "react";
import ConfirmStatusModal from "../common/ConfirmModal";
import { ReferenceIdModal } from "../common/ReferenceModal";
import VerifyOTPModal from "../common/VerifyModal";
import RejectReasonModal from "../common/RejectModal";
import CustomChargeModal from "../common/AddingChargeModal";
import { useUIStore } from "@/store/ui.store";

interface Props {
  request: ServiceRequest;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  onRequestStatusUpdate?: () => void;
}

export default function RequestDetailsPage({ request, setShowDetails }: Props) {
  const { accept, reject, updateStatus, payment, updatePriceDetails } = useServiceRequestStore();
  const shopID = useShopStore((s) => s.shop?.id);

  // Modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showChargeUI, setShowChargeUI] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // UI states
  const [activeSection, setActiveSection] = useState<"service" | "timeline" | "price" | null>(null);

  // Custom charge states
  const [chargeName, setChargeName] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [addingCharge, setAddingCharge] = useState(false);
  const [editingCharge, setEditingCharge] = useState<{ id: string; amount: number } | null>(null);
  const [removingFeeId, setRemovingFeeId] = useState<string | null>(null);
  const [showInlineCharge, setShowInlineCharge] = useState(false);


  // Computed values
  const serviceCharges = request.priceDetails.filter((p) => p.category === "service");
  const mandatoryAdditionalCharges = request.priceDetails.filter(
    (item) => item.category === "additional" && item.isMandatory
  );
  const customAdditionalCharges = request.priceDetails.filter(
    (item) => item.category === "additional" && item.isCustom
  );
  const totalAmount = request.priceDetails.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const paymentCollected = request.payment_status === "paid";

  // Core handlers
  const handleClose = () => {
    setShowDetails(false);
  };

  const startStatusWorkflow = () => {
    if (request.status === "pending" || request.status === "active" || request.status === "applied") {
      setShowConfirm(true);
    }
  };

  // Event listener for external status workflow trigger
  useEffect(() => {
    const handler = () => startStatusWorkflow();
    document.addEventListener("start-status-workflow", handler);
    return () => document.removeEventListener("start-status-workflow", handler);
  }, [request.id]);

  // Status change handlers
  const handleStatusChange = async (status: "pending" | "rejected", reason?: string) => {
    if (!shopID) return;

    try {
      if (status === "pending") {
        await accept(request.id, shopID);
      }
      if (status === "rejected" && reason) {
        await reject(request.id, shopID, reason);
      }
    } catch (err) {
      toast.error("Failed to update request");
    }
  };

  // Custom charge handlers
  const handleAddCustomCharge = async () => {
    if (!chargeName.trim() || !chargeAmount || Number(chargeAmount) <= 0) {
      toast.error("Enter valid charge name and amount");
      return;
    }

    if (!shopID) return;

    const price = Number(chargeAmount);
    const tempId = crypto.randomUUID();
    setAddingCharge(true);

    try {
      // Update local state optimistically
      useServiceRequestStore.getState().updateLocalRequest(request.id, (req) => {
        let updatedPriceDetails = req.priceDetails;
        let updatedAmount = req.amount;

        if (editingCharge) {
          updatedPriceDetails = updatedPriceDetails.filter((p) => p.id !== editingCharge.id);
          updatedAmount -= editingCharge.amount;
        }

        updatedPriceDetails = [
          ...updatedPriceDetails,
          {
            id: tempId,
            label: chargeName.trim(),
            amount: price,
            category: "additional" as const,
            isMandatory: false,
            isCustom: true,
          },
        ];
        updatedAmount += price;

        return {
          ...req,
          priceDetails: updatedPriceDetails,
          amount: updatedAmount,
        };
      });

      // Prepare API payload
      const payload = {
        request_id: request.id,
        shop_id: shopID,
        ...(editingCharge && { removed_fee_ids: [editingCharge.id] }),
        custom_charges: [{ name: chargeName.trim(), price }],
      };

      await updatePriceDetails(payload);
      toast.success(editingCharge ? "Custom charge updated" : "Custom charge added");

      // Reset form
      setShowChargeUI(false);
      setEditingCharge(null);
      setChargeName("");
      setChargeAmount("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update custom charge");
    } finally {
      setAddingCharge(false);
    }
  };

  const handleRemoveCustomCharge = async (feeId: string, amount: number) => {
    if (!shopID) return;

    setRemovingFeeId(feeId);
    const payload = {
      request_id: request.id,
      shop_id: shopID,
      removed_fee_ids: [feeId],
    };

    try {
      // Update local state
      useServiceRequestStore.getState().updateLocalRequest(request.id, (req) => ({
        ...req,
        priceDetails: req.priceDetails.filter((p) => p.id !== feeId),
        amount: req.amount - amount,
      }));

      await updatePriceDetails(payload);
      toast.success("Custom charge removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove charge");
    } finally {
      setRemovingFeeId(null);
    }
  };

  // Status workflow helpers
  const getNextStatusLabel = () => {
    if (request.status === "pending") return "In Progress";
    if (request.status === "active") return "Applied";

    if (request.status === "applied" && !paymentCollected)
      return "Cash Collected";

    if (request.status === "applied" && paymentCollected)
      return "Completed";

    return "";
  };


  const handleStatusConfirm = () => {
    if (request.status === "pending") {
      setShowOTP(true);
    }
    else if (request.status === "active") {
      setShowRef(true);
    }
    else if (request.status === "applied") {
      if (!paymentCollected) {
        // FIRST STEP → collect cash
        handlePayment();
      } else {
        // SECOND STEP → mark completed
        setShowCompleteConfirm(true);
      }
    }
  };


  // Modal handlers
  const handleOTPConfirm = async () => {
    if (!shopID) {
      toast.error("Shop ID not available");
      return;
    }
    try {
      await updateStatus({
        request_id: request.id,
        shop_id: shopID,
        status: "active",
        otp: request.otp || undefined,
      });
      toast.success("Status updated to In Progress");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update request status");
    } finally {
      setShowOTP(false);
    }
  };

  const handleReferenceConfirm = async (refId: string) => {
    if (!shopID) return;
    try {
      await updateStatus({
        request_id: request.id,
        shop_id: shopID,
        status: "applied",
        note: refId,
      });
      toast.success("Request marked as Applied");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply request");
    } finally {
      setShowRef(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!paymentCollected) {
      toast.error("Payment is pending. Please collect payment first.");
      setShowCompleteConfirm(false);
      return;
    }

    if (!shopID) return;

    try {
      await updateStatus({
        request_id: request.id,
        shop_id: shopID,
        status: "completed",
        note: "Service completed after cash collection",
      });

      useServiceRequestStore.getState().updateLocalRequest(request.id, (req) => ({
        ...req,
        status: "completed",
      }));

      toast.success("Service marked as Completed");
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark as completed");
    } finally {
      setShowCompleteConfirm(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!shopID) return;
    try {
      await reject(request.id, shopID, reason);
      toast.success("Request cancelled");
      handleClose();
    } catch (err: any) {
      toast.error("Failed to reject request");
    } finally {
      setShowRejectModal(false);
    }
  };

  const handlePayment = async () => {
    if (!shopID) return;

    try {
      await payment({
        request_id: request.id,
        shop_id: shopID,
        payment_status: "paid",
        payment_mode: "cash",
        note: "Cash collected from customer",
      });

      // Update local state ONLY payment
      useServiceRequestStore.getState().updateLocalRequest(request.id, (req) => ({
        ...req,
        payment_status: "paid",
      }));

      toast.success("Cash collected successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to collect payment");
    }
  };


  // Desktop layout
  const renderDesktopLayout = () => (
    <div className="w-full max-h-[90vh]  md:overflow-y-auto bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-2xl sm:shadow-md animate-slideUp">
      <div className="relative w-full h-full space-y-6 p-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="hidden sm:block absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          aria-label="Close details"
        >
          <FiX />
        </button>

        {/* Customer Info */}
        <div className="bg-white dark:bg-gray-800 p-4 mb-4 rounded-lg">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FiUser />
            {request.customerName}
          </div>
          <p className="text-sm text-gray-500 mt-1">{request.customerPhone}</p>
        </div>

        {/* Service Request - Collapsible */}
        <div className="bg-white dark:bg-gray-800/95 rounded-lg shadow dark:border border-gray-600 mb-4">
          <button
            onClick={() => setActiveSection(activeSection === "service" ? null : "service")}
            className="flex items-center justify-between w-full text-left p-4"
          >
            <div className="flex items-center gap-2 text-md font-semibold">
              <FiFileText />
              Service Request
            </div>
            {activeSection === "service" ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          {activeSection === "service" && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <div className="mt-3">
                <p className="text-gray-900 font-medium dark:text-white">{request.serviceName}</p>
                <p className="font-sm text-gray-900 dark:text-gray-300">{request.serviceType}</p>
                <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                  {request.serviceDetails
                    .replace(/(\d+)\./g, "\n$1.")
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((detail, index) => (
                      <li key={index} className="py-1">
                        {detail.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Timeline - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border border-gray-600 mb-4">
          <button
            onClick={() => setActiveSection(activeSection === "timeline" ? null : "timeline")}
            className="flex items-center justify-between w-full text-left p-4"
          >
            <div className="flex items-center gap-2 text-md font-semibold">
              <FiClock />
              Timeline
            </div>
            {activeSection === "timeline" ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          {activeSection === "timeline" && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4 mt-3">
                {request.timeline?.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1">
                      <FiCheckCircle
                        className={`${event.status === "success" ? "text-green-500" : "text-blue-500"
                          }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Details - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:border border-gray-600 mb-4">
          <button
            onClick={() => setActiveSection(activeSection === "price" ? null : "price")}
            className="flex items-center justify-between w-full text-left p-4"
          >
            <div className="flex items-center gap-2 text-md font-semibold">
              <FiInfo />
              Price Details
            </div>
            {activeSection === "price" ? (
              <FiChevronUp className="text-gray-500" />
            ) : (
              <FiChevronDown className="text-gray-500" />
            )}
          </button>

          {activeSection === "price" && (
            <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4 mt-3">
                {/* Service Charges */}
                {serviceCharges.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Service Charges
                    </p>
                    <div className="space-y-2">
                      {serviceCharges.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {item.label}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ₹{Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Charges */}
                {(mandatoryAdditionalCharges.length > 0 || customAdditionalCharges.length > 0) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Additional Charges
                    </p>
                    <div className="space-y-2">
                      {[...mandatoryAdditionalCharges, ...customAdditionalCharges].map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            {item.isCustom && request.status === "applied" && !paymentCollected && item.id && (
                              <>
                                <button
                                  onClick={() => handleRemoveCustomCharge(item.id, Number(item.amount))}
                                  className="text-red-500 hover:text-red-700 bg-red-100 rounded-full p-1 cursor-pointer disabled:opacity-50"
                                  title="Remove charge"
                                  disabled={removingFeeId === item.id}
                                >
                                  {removingFeeId === item.id ? "..." : <FiX size={12} />}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCharge({ id: item.id, amount: Number(item.amount) });
                                    setChargeName(item.label);
                                    setChargeAmount(String(item.amount));
                                    setShowChargeUI(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-700 cursor-pointer"
                                  title="Edit charge"
                                >
                                  ✏️
                                </button>
                              </>
                            )}
                            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ₹{Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                  <span className="text-gray-900 dark:text-gray-100">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Applied Status Actions */}
              {request.status === "applied" && (
                <div className="mt-6 space-y-4">
                  {!paymentCollected && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <button
                        onClick={() => setShowChargeUI(true)}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
                      >
                        + Add Custom Charge
                      </button>
                    </div>
                  )}

                  {!paymentCollected && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition"
                      >
                        Cancel Request
                      </button>
                      <button
                        onClick={handlePayment}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
                      >
                        {paymentCollected ? "Payment Recorded" : "Cash Collected"}
                      </button>
                    </div>
                  )}

                  {paymentCollected && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-center text-green-700 dark:text-green-300">
                      ✓ Cash Collected
                    </div>
                  )}
                </div>
              )}

              <RequestActionFooter request={request} onStatusChange={handleStatusChange} />
            </div>
          )}
        </div>

        <ConfirmStatusModal
          open={showConfirm}
          title="Update Status"
          description={`Are you sure you want to update status from ${request.status} to ${getNextStatusLabel()}?`}
          confirmText="Yes, Continue"
          rejectText="Cancel Request"
          onClose={() => setShowConfirm(false)}
          onReject={() => {
            setShowConfirm(false);
            setShowRejectModal(true);
          }}
          onConfirm={() => {
            setShowConfirm(false);
            handleStatusConfirm();
          }}
        />

        {/* OTP Verification Modal */}
        <VerifyOTPModal
          open={showOTP}
          correctOtp={request.otp}
          onClose={() => setShowOTP(false)}
          onCancel={() => setShowOTP(false)}
          onConfirm={handleOTPConfirm}
        />

        {/* Reference ID Modal */}
        <ReferenceIdModal
          open={showRef}
          title="Update Status"
          placeholder="Reference Number"
          onClose={() => setShowRef(false)}
          onCancel={() => setShowRef(false)}
          onConfirm={handleReferenceConfirm}
        />

        {/* Complete Service Confirmation */}
        <ConfirmStatusModal
          open={showCompleteConfirm}
          title="Complete Service"
          description={
            paymentCollected
              ? "Are you sure you want to update status from Applied to Completed?"
              : "Payment not yet collected. Please collect payment before completing the service."
          }
          confirmText="Yes, Complete"
          rejectText="No"
          variant="default"
          onClose={() => setShowCompleteConfirm(false)}
          onReject={() => {
            setShowCompleteConfirm(false);
            setShowRejectModal(true);
          }}
          onConfirm={handleCompleteConfirm}
        />

        {/* Reject Reason Modal */}
        <RejectReasonModal
          open={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={handleRejectConfirm}
        />

        {/* Custom Charge Modal */}
        <CustomChargeModal
          open={showChargeUI}
          onClose={() => {
            setShowChargeUI(false);
            setChargeName("");
            setChargeAmount("");
            setEditingCharge(null);
          }}
          chargeName={chargeName}
          chargeAmount={chargeAmount}
          setChargeName={setChargeName}
          setChargeAmount={setChargeAmount}
          onSubmit={handleAddCustomCharge}
          loading={addingCharge}
          isEditing={!!editingCharge}
        />
      </div>
    </div>
  );


  // Mobile layout 
  const renderMobileLayout = () => (
    <div className="fixed inset-0 z-[50] bottom-16 md:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] flex flex-col shadow-xl animate-slideUp">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Service Request</h2>
          <button onClick={handleClose} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <FiX size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50 dark:bg-gray-900">
          {/* Service Request Card */}
          <div className="border rounded-2xl border-slate-300 p-4 dark:border-gray-500">
            <p className="text-gray-900 dark:text-white font-semibold">Service Request</p>
            <p className="text-md mt-1 text-gray-900 dark:text-gray-300">{request.serviceName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{request.serviceType}</p>
          </div>


          {/* Price Details - Collapsible */}
          <div className="border border-slate-300 rounded-2xl dark:border-gray-500">
            <button
              onClick={() => setActiveSection(activeSection === "price" ? null : "price")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-2 font-medium">
                <FiInfo /> Price Details
              </div>
              {activeSection === "price" ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {activeSection === "price" && (
              <div className="px-4 pb-4 text-sm space-y-3">
                {/* Price Items */}
                {request.priceDetails.map((item) => {
                  const isCustom = item.category === "additional" && item.isCustom;
                  const canEdit = isCustom && request.status === "applied" && !paymentCollected;

                  // Check if this item is currently being edited
                  const isEditingThis = editingCharge?.id === item.id;

                  return (
                    <div key={item.id}>
                      {isEditingThis ? (
                        // ── Inline Edit Form ──
                        <div className="border border-slate-300 rounded-lg p-3 space-y-3 bg-white dark:bg-gray-800">
                          <input
                            type="text"
                            placeholder="Service / charge name"
                            value={chargeName}
                            onChange={(e) => setChargeName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={chargeAmount}
                            onChange={(e) => setChargeAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                // Cancel edit
                                setEditingCharge(null);
                                setChargeName("");
                                setChargeAmount("");
                              }}
                              className="flex-1 py-2 rounded-xl border border-gray-400 text-gray-600 dark:text-gray-300"
                            >
                              Cancel
                            </button>

                            <button
                              onClick={async () => {
                                await handleAddCustomCharge(); // same handler as add (it handles edit too)
                                setEditingCharge(null);
                              }}
                              disabled={addingCharge}
                              className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              {addingCharge ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        
                        <div className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2 flex-1">
                            {canEdit && item.id && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingCharge({ id: item.id, amount: Number(item.amount) });
                                    setChargeName(item.label);
                                    setChargeAmount(String(item.amount));
                                  }}
                                  className="text-blue-500 hover:text-blue-700 text-base"
                                  title="Edit charge"
                                >
                                  ✏️
                                </button>

                                <button
                                  onClick={() => handleRemoveCustomCharge(item.id, Number(item.amount))}
                                  disabled={removingFeeId === item.id}
                                  className="text-red-500 hover:text-red-700 bg-red-100 rounded-full p-1 disabled:opacity-50"
                                  title="Remove charge"
                                >
                                  {removingFeeId === item.id ? "..." : <FiX size={12} />}
                                </button>
                              </div>
                            )}

                            <span className="text-gray-600 dark:text-gray-400">
                              {item.label}
                            </span>
                          </div>

                          <span className="font-medium whitespace-nowrap">
                            ₹{Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inline Add New Custom Charge */}
                {request.status === "applied" && !paymentCollected && (
                  <div className="p-3 border-t border-slate-300">
                    {!showInlineCharge ? (
                      <button
                        onClick={() => setShowInlineCharge(true)}
                        className="w-full py-2 rounded-xl border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition"
                      >
                        + Add custom charge
                      </button>
                    ) : (
                      <div className="space-y-3 mt-3 border p-3 border-slate-300 rounded-lg">
                        <input
                          type="text"
                          placeholder="Service / charge name"
                          value={chargeName}
                          onChange={(e) => setChargeName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowInlineCharge(false);
                              setChargeName("");
                              setChargeAmount("");
                            }}
                            className="flex-1 py-2 rounded-xl border border-gray-400 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={async () => {
                              await handleAddCustomCharge();
                              setShowInlineCharge(false);
                            }}
                            disabled={addingCharge}
                            className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                          >
                            {addingCharge ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline - Collapsible */}
          <div className="border border-slate-300 rounded-2xl dark:border-gray-500">
            <button
              onClick={() => setActiveSection(activeSection === "timeline" ? null : "timeline")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-2 font-medium">
                <FiClock /> View Progress
              </div>
              {activeSection === "timeline" ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {activeSection === "timeline" && (
              <div className="px-4 pb-4 space-y-3 text-sm">
                {request.timeline?.map((event) => (
                  <div key={event.id} className="flex gap-2">
                    <FiCheckCircle className="text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Confirmation Prompt */}
        {request.status !== "completed" && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
            <p className="text-center text-sm text-gray-900 dark:text-gray-300 mb-5 leading-relaxed">
              Are you sure you want to change the status from <br />
              <span className="font-semibold capitalize">{request.status}</span> →{" "}
              <span className="font-semibold">{getNextStatusLabel()}</span>?
            </p>

            <div className="flex gap-3">
              {request.status === "applied" && !paymentCollected ? (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-3 rounded-xl border border-red-500 text-red-500 font-medium hover:bg-red-50 transition"
                  >
                    Reject
                  </button>

                  <button
                    onClick={handleStatusConfirm}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition"
                  >
                    Cash Collected
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-3 rounded-xl border border-red-500 text-red-500 font-medium hover:bg-red-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleStatusConfirm}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                  >
                    Confirm
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );



  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const isModal = useUIStore((s)=>s.isModalOpen)

  // Render
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      {/* Desktop sidebar */}
      {isDesktop && (
        <div className={"hidden md:block request-details-sidebar sticky top-20 z-[100]"}>
          {renderDesktopLayout()}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {!isDesktop && (
        <div className={`md:hidden ${isModal?"hidden":""}`}>
          {renderMobileLayout()}
        </div>
      )}


      {/* Status Confirmation Modal */}
      <ConfirmStatusModal
        open={showConfirm}
        title="Update Status"
        description={`Are you sure you want to update status from ${request.status} to ${getNextStatusLabel()}?`}
        confirmText="Yes, Continue"
        rejectText="Cancel Request"
        onClose={() => setShowConfirm(false)}
        onReject={() => {
          setShowConfirm(false);
          setShowRejectModal(true);
        }}
        onConfirm={() => {
          setShowConfirm(false);
          handleStatusConfirm();
        }}
      />

      {/* OTP Verification Modal */}
      <VerifyOTPModal
        open={showOTP}
        correctOtp={request.otp}
        onClose={() => setShowOTP(false)}
        onCancel={() => setShowOTP(false)}
        onConfirm={handleOTPConfirm}
      />

      {/* Reference ID Modal */}
      <ReferenceIdModal
        open={showRef}
        title="Update Status"
        placeholder="Reference Number"
        onClose={() => setShowRef(false)}
        onCancel={() => setShowRef(false)}
        onConfirm={handleReferenceConfirm}
      />

      {/* Complete Service Confirmation */}
      <ConfirmStatusModal
        open={showCompleteConfirm}
        title="Complete Service"
        description={
          paymentCollected
            ? "Are you sure you want to update status from Applied to Completed?"
            : "Payment not yet collected. Please collect payment before completing the service."
        }
        confirmText="Yes, Complete"
        rejectText="No"
        variant="default"
        onClose={() => setShowCompleteConfirm(false)}
        onReject={() => {
          setShowCompleteConfirm(false);
          setShowRejectModal(true);
        }}
        onConfirm={handleCompleteConfirm}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onCancel={() => setShowRejectModal(false)}
        onConfirm={handleRejectConfirm}
      />

      {/* Custom Charge Modal */}
      <CustomChargeModal
        open={showChargeUI}
        onClose={() => {
          setShowChargeUI(false);
          setChargeName("");
          setChargeAmount("");
          setEditingCharge(null);
        }}
        chargeName={chargeName}
        chargeAmount={chargeAmount}
        setChargeName={setChargeName}
        setChargeAmount={setChargeAmount}
        onSubmit={handleAddCustomCharge}
        loading={addingCharge}
        isEditing={!!editingCharge}
      />
    </div>
  );
}