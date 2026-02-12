// components/my-requests/RequestCard.tsx
"use client";

import { FiCalendar } from "react-icons/fi";
import { ServiceRequest } from "@/types/myrequest";
import { getUIStage } from "@/lib/requestStage";
import { SidebarIcon } from "../ui/SidebarIcon";

interface RequestCardProps {
    request: ServiceRequest;
    isSelected: boolean;
    onSelect: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export default function RequestCard({
    request,
    isSelected,
    onSelect,
    onAccept,
    onReject,
}: RequestCardProps) {
    const getStatusStyle = (status: ServiceRequest["status"]) => {
        const styles: Record<string, string> = {
            upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-800/40 dark:text-blue-200 border-blue-300",
            pending: "bg-orange-100 text-orange-800 dark:bg-orange-800/40 dark:text-orange-200 border-orange-300",
            "active": "bg-purple-100 text-purple-800 dark:bg-purple-800/40 dark:text-purple-200 border-purple-300",
            applied: "bg-indigo-100 text-indigo-800 dark:bg-indigo-800/40 dark:text-indigo-200 border-indigo-300",
            completed: "bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-200 border-green-300",
            rejected: "bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-200 border-red-300",
        };
        return styles[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300";
    };
    const stage = getUIStage(request);

    const displayDateTime = () => {
        if (!request.requestedDate || !request.requestedTime) return "—";
        return `${request.requestedDate} • ${request.requestedTime}`;
    };

    return (

        <>
            <div
                className="md:hidden rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={onSelect}
            >
                <div className="bg-blue-50 dark:bg-gray-800 px-4 py-6 space-y-4 ">
                    {/* Top Section */}
                    <div className="flex items-start justify-between ">
                        <div className="flex gap-2">
                            <div className="w-1 bg-blue-600 rounded-full" />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {request.customerName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {displayDateTime()}
                                </p>
                            </div>
                        </div>

                        <div className="text-blue-600 text-lg">
                            <SidebarIcon
                                src="/assets/icons/ic_call.svg"
                                size={22}
                                alt="phone"
                                className="fill-blue-300"
                            />
                        </div>
                    </div>

                    {/* Service */}
                    <div>
                        <p className="text-gray-900  dark:text-white">
                            {request.serviceName}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-300">
                            {request.serviceType}
                        </p>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="w-full flex items-center justify-between p-4">
                    <span className={`${getStatusStyle(request.status)} px-3 py-2 text-xs rounded-full dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
                        Status {request.status}
                    </span>

                    <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        ₹ {request.amount}
                    </button>
                </div>
            </div>

            {/* Desktop view */}
            <div
                className={`request-card hidden sm:block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${isSelected
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } transition-all cursor-pointer`}
                onClick={(e) => {
                    // Only select if clicking the card itself — not the buttons inside
                    if ((e.target as HTMLElement).closest('button')) return;
                    onSelect();
                }}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {request.customerName}
                            </h3>
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(request.status)}`}
                            >
                                {request.status === "active"
                                    ? "In Progress"
                                    : request.status.charAt(0).toUpperCase() + request.status.slice(1).replace("-", " ")}
                            </span>
                        </div>

                        <div className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            ₹{request.amount}
                        </div>
                    </div>

                    {/* Service Details */}
                    <div>
                         <p className="text-gray-900  dark:text-white mb-2">
                            {request.serviceName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-100 line-clamp-2">
                            {request.serviceType}
                        </p>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar className="w-4 h-4 flex-shrink-0" />
                        <span>{displayDateTime()}</span>
                    </div>

                    {/* Bottom row: Accept/Reject OR View Details */}
                    {/* Bottom row */}
                    {stage === "upcoming" && request.status === "upcoming" && (
                        <div className="flex justify-between items-center mt-1">
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReject(request.id);
                                    }}
                                    className="py-2 px-4 bg-red-600 text-white rounded-lg"
                                >
                                    Reject
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAccept(request.id);
                                    }}
                                    className="py-2 px-4 bg-green-600 text-white rounded-lg"
                                >
                                    Accept
                                </button>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect();
                                }}
                                className="text-sm text-blue-400 cursor-pointer font-medium"
                            >
                                View Details
                            </button>
                        </div>
                    )}

                    {request.status !== "upcoming" && (
                        <div className="flex justify-end gap-10 mt-2">
                            {stage !== "completed" && stage !== "rejected" && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect();
                                        setTimeout(() => {
                                            document.dispatchEvent(
                                                new CustomEvent("start-status-workflow")
                                            );
                                        }, 100);
                                    }}

                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer font-medium">
                                    Update Status
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect();
                                }}
                                className="text-sm text-blue-400 hover:text-blue-500 cursor-pointer font-medium"
                            >
                                View Details
                            </button>
                        </div>
                    )}


                </div>
            </div>
        </>

    );
}