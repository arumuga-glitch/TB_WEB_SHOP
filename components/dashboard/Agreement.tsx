"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useShopStore } from "@/store/shopStore";
import { uploadServiceAgreement } from "@/lib/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface AgreementDialogProps {
    onAccept: () => void;
}

export default function AgreementDialog({ onAccept }: AgreementDialogProps) {
    const { user } = useAuthStore();
    const { shop, setShop } = useShopStore();
    const [isSigned, setIsSigned] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const shopName = shop?.name || user?.shop_name || "Your Shop Name";
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const effectiveDate = `${day}/${month}/${year}`;
    const generatedDate = `${day}-${month}-${year}`;


    // Intro content
    const introContent = `
This Service Agreement ('Agreement') is entered into between the Platform and the Service Provider, upon digital acceptance or signature, and shall govern all transactions thereafter.

Parties:
• Platform Provider: Thendral Booking, hereinafter referred to as "Platform"
• Service Provider: ${shopName}, hereinafter referred to as "Service Provider"
• Effective Date: ${effectiveDate}
  `;

    // Full terms (your existing content – unchanged)
    const termsContent = `
1. Purpose of Agreement
To define the scope of arrangement between the Platform and the Service Provider to deliver government-related services (e.g., Aadhaar, Voter ID, TNReginet, etc.) to Users who book appointments or visit the Service Provider through the Platform.

2. Roles & Responsibilities
a) Platform:
• Facilitate customer registration and route them to appropriate Service Provider based on services required and location.
• Collect government-prescribed fees and platform charges, or authorize the Service Provider to collect the same.
• Share booking and service details with the assigned Service Provider.
• Provide tech support and reporting dashboards (if applicable).

b) Service Provider:
• Provide timely and professional service to customers routed via the Platform.
• Collect only the charges as prescribed by the Platform, in addition to government fees.
• Not charge any extra or hidden fees without prior written approval.
• Handle all document verification, uploading, and submissions on government portals.
• Issue receipt for any government fee or service fee collected.
• Maintain confidentiality and data security of customer details.
• Provide service status updates to the Platform (manually or via API, if available).

3. Fee Structure & Revenue Sharing
Govt Fee: To be collected and deposited to the relevant authority or portal.
Platform Charge: Rs 15 per service (inclusive of GST and applicable taxes), to be either:
• Paid directly by the customer through the app, or
• Collected by the Service Provider and remitted to the Platform weekly.

Service Provider Fee: As fixed by the Platform per service category and collected by the Service Provider in accordance with the prescribed structure. The detailed fee structure is available in the Dashboard. The Service Provider may check for updated fee structure available therein from time to time.

The Service Provider agrees not to charge more than the prescribed fee structure.
The Service Provider shall pay a sum of Rs 500 towards security deposit to the Platform which is refundable without interest at the time of termination of this Agreement.

4. Billing & Settlement
Service Provider shall remit the Platform Fee (if collected on behalf of the Platform) within seven (7) days from the date of collection.
The Platform shall raise a GST-compliant invoice for such amounts to the Customer.
Delayed payments may attract an interest charge at 1% per month and/or lead to temporary or permanent suspension of access.

5. Service Quality and Timelines
The Service Provider shall provide services within 24 to 48 hours of booking, subject to the operational availability and performance of the respective government portals.
Any unattended or declined bookings shall be reported to the Platform with valid reasons.
The Service Provider shall not misrepresent the Platform or act as an agent of any government body.

6. Data Privacy and Compliance
The Service Provider shall not misuse or store any personal data of customers for unauthorized purposes.
All data shall be used strictly to complete government service workflows.
The Service Provider agrees to comply with the Digital Personal Data Protection Act, 2023, and any other applicable rules.

7. Audit and Verification
The Platform reserves the right to verify customer feedback, inspect the Service Provider, and audit records related to platform-referred customers. Any overcharging, misbehaviour, or fraud will result in suspension / termination.

8. Termination Clause
Either party may terminate the agreement with 30 days' written notice.
The Platform reserves the right to terminate this Agreement with immediate effect in cases of: (a) fraud or misrepresentation, (b) charging unauthorized fees, (c) breach of terms, (d) repeated customer complaints or (e) Inactive on the part of the Service Provider for a continuous period of 30 days.

9. Limitation of Liability
The Platform is not liable for any errors committed by the Service Provider in documentation or service execution. The Service Provider shall be solely responsible for any government penalties or customer claims arising from their end.

10. Brand and Promotion
The Service Provider may display Platform branding with prior permission.
Use of the Platform's name, logo, or brand in any advertisements or promotional materials is strictly prohibited without prior written approval.
The Platform may provide onboarding training / FAQ to the Service Provider for uniform service delivery for a prescribed fee which may be fixed from time to time depending on the nature of training provided.

11. Dispute Resolution
Any disputes shall first be attempted to be resolved amicably. If unresolved, they shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996.
Jurisdiction: Courts in Coimbatore.

12. Force Majeure
Neither party shall be held responsible for delays caused by events beyond the reasonable control of either party, including but not limited to server outages, govt portal downtime, natural calamities, etc.

13. General Provisions
This Agreement shall be governed by and construed in accordance with the laws of India.
No modification of this Agreement shall be valid unless recorded in writing and electronically or physically signed by both parties.
Nothing in this Agreement shall be deemed to create a partnership, joint venture, employer-employee relationship, or agency between the parties.
For matters not specifically addressed in this Agreement, the principles of general interpretation under Indian contract law shall apply.
  `;

    // Signature pad logic (unchanged)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2.8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const draw = (e: PointerEvent) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            lastX = x;
            lastY = y;
            setIsSigned(true);
        };

        const start = (e: PointerEvent) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        };

        const stop = () => (isDrawing = false);

        canvas.addEventListener("pointerdown", start);
        canvas.addEventListener("pointermove", draw);
        canvas.addEventListener("pointerup", stop);
        canvas.addEventListener("pointerout", stop);

        return () => {
            canvas.removeEventListener("pointerdown", start);
            canvas.removeEventListener("pointermove", draw);
            canvas.removeEventListener("pointerup", stop);
            canvas.removeEventListener("pointerout", stop);
        };
    }, []);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setIsSigned(false);
        }
    };

    const handleAccept = async () => {
        if (!isSigned) {
            toast.error("Please provide your digital signature");
            return;
        }
        if (!isAgreed) {
            toast.error("Please agree to the terms and conditions");
            return;
        }
        if (!canvasRef.current || !shop?.id) {
            toast.error("Missing required data");
            return;
        }

        const documentId = `SA-${Date.now()}`;

        setIsSubmitting(true);

        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = margin + 10;
            let pageNum = 1;

            // Helper function to check and add new page
            const checkAndAddPage = (neededSpace: number) => {
                if (y + neededSpace > pageHeight - margin) {
                    pdf.addPage();
                    pageNum++;
                    y = margin + 10;
                    return true;
                }
                return false;
            };

            // Title
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0, 191, 255);
            pdf.text("Service Agreement Between Platform and Service Provider", pageWidth / 2, y, { align: "center" });
            y += 15;

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(0, 0, 0)

            const introLines = introContent.split('\n');

            for (const line of introLines) {
                if (line.trim() === '') {
                    y += 3;
                } else {
                    if (line.trim().startsWith('•') && line.trim().endsWith(':')) {
                        pdf.setFont("helvetica", "bold");
                        const bulletText = line.trim().substring(1).trim();
                        pdf.text('•', margin, y);
                        pdf.text(bulletText, margin + 4, y);
                        y += 6;
                    }
                    else {
                        const splitLines = pdf.splitTextToSize(line.trim(), contentWidth);

                        for (const splitLine of splitLines) {
                            pdf.text(splitLine, margin, y);
                            y += 6;
                        }

                        continue;
                    }
                }
            }

            y += 5;

            // Process terms content (exactly as shown in web)
            const termsLines = termsContent.split('\n');

            for (const line of termsLines) {
                if (line.trim() === '') {
                    y += 3;
                    continue;
                }

                checkAndAddPage(8);

                // Numbered sections (e.g., "1. Purpose of Agreement")
                if (/^\d+\.\s/.test(line.trim())) {
                    pdf.setFontSize(14);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(0, 191, 255);
                    pdf.text(line.trim(), margin, y);
                    y += 8;
                }
                // Lettered subsections (e.g., "a) Platform:", "b) Service Provider:")
                else if (/^[a-z]\)\s/.test(line.trim())) {
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(line.trim(), margin + 4, y);
                    y += 6;
                }
                // Bullet points
                else if (line.trim().startsWith('•')) {
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(0, 0, 0);

                    const bulletText = line.trim().substring(1).trim();
                    const splitLines = pdf.splitTextToSize(bulletText, contentWidth - 8);

                    for (let i = 0; i < splitLines.length; i++) {
                        if (i === 0) {
                            pdf.text('•', margin, y);
                            pdf.text(splitLines[i], margin + 4, y);
                        } else {
                            pdf.text(splitLines[i], margin + 4, y);
                        }
                        y += 5;
                    }
                }
                // Regular text (including "Govt Fee:", "Platform Charge:", etc.)
                else {
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(0, 0, 0);

                    const splitLines = pdf.splitTextToSize(line.trim(), contentWidth - 4);
                    for (const splitLine of splitLines) {
                        pdf.text(splitLine, margin + 2, y);
                        y += 5;
                    }
                }
            }

            // Signature Section (matches web display)
            checkAndAddPage(60);

            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0, 191, 255); // sky-500 color
            pdf.text("Digital Signature", margin, y);
            y += 10;

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(0, 0, 0);
            pdf.text("Please sign in the box below", margin, y);
            y += 15;

            // Draw signature image
            const sigData = canvasRef.current.toDataURL("image/png");

            const sigWidth = 30;
            const sigHeight =
                (canvasRef.current.height / canvasRef.current.width) * sigWidth;

            const extra = 5; // how much corner extends

            // Add signature image
            pdf.addImage(sigData, "PNG", margin, y, sigWidth, sigHeight);

            // Set border style
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.3);

            // Bottom extended line
            pdf.line(
                margin - extra,                
                y + sigHeight + extra,          
                margin + sigWidth + extra,      
                y + sigHeight + extra
            );

           
            pdf.line(
                margin + sigWidth + extra,      
                y - extra,                     
                margin + sigWidth + extra,
                y + sigHeight + extra
            );

            y += sigHeight + 15;


            // Checkbox and agreement text
            pdf.setFontSize(11);
            pdf.text("I have read and agree to the terms and conditions of this Service Agreement. I understand that by signing this", margin, y);
            y += 6;
            pdf.text("agreement, I am legally bound to its terms.", margin, y);
            y += 10;

            // Add Generated on and Document ID
            checkAndAddPage(20);
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on: ${generatedDate}`, margin, y);
            y += 6;
            pdf.text(`Document ID: ${documentId}`, margin, y);


            // Output
            const blob = pdf.output("blob");
            const file = new File([blob], `service-agreement-${shop.id}-${Date.now()}.pdf`, {
                type: "application/pdf",
            });

            await uploadServiceAgreement(shop.id, file);
            toast.success("Service agreement generated & uploaded");

            // Optional: download for preview
            pdf.save(`service-agreement-${shop.id}.pdf`);

            setShop({ ...shop, service_agreement: "signed" });
            onAccept();

        } catch (err: any) {
            console.error(err);
            toast.error("Failed to generate PDF");
        } finally {
            setIsSubmitting(false);
        }
    };
    if (!user || !shop) return null;

    // Function to format terms content with blue headings and proper list styling
    const formatTermsContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            // Check if line is a numbered section (e.g., "1. Purpose of Agreement")
            if (/^\d+\.\s/.test(line)) {
                return (
                    <div key={index} className="mt-4 first:mt-0">
                        <h3 className="text-lg font-bold text-sky-500 mb-2">{line}</h3>
                    </div>
                );
            }
            // Check if line is a lettered subsection (e.g., "a) Platform:", "b) Service Provider:")
            else if (/^[a-z]\)\s/.test(line)) {
                return (
                    <div key={index} className="ml-4 mt-2 font-semibold">
                        {line}
                    </div>
                );
            }
            // Check if line contains bullet points
            else if (line.trim().startsWith('•')) {
                return (
                    <ul key={index} className="list-disc ml-8 mt-1 text-gray-700 dark:text-gray-300">
                        <li>{line.trim().substring(1).trim()}</li>
                    </ul>
                );
            }
            // Regular text
            else if (line.trim() !== '') {
                return (
                    <p key={index} className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                        {line}
                    </p>
                );
            }
            // Empty line
            else {
                return <div key={index} className="h-2"></div>;
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-w-4xl w-full max-h-[90vh] flex flex-col">

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                    <div ref={contentRef}>
                        {/* Service Agreement Section */}
                        <div className="mb-8">
                            <h2 className="text-xl text-center font-bold text-sky-500 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
                                Service Agreement Between Platform and Service Provider
                            </h2>
                            <div className="prose prose-sm sm:prose-base dark:prose-invert whitespace-pre-line leading-relaxed ml-2">
                                {introContent}
                            </div>
                        </div>

                        {/* Agreement Terms Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-sky-500 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
                                Agreement Terms
                            </h2>
                            <div className="space-y-1">
                                {formatTermsContent(termsContent)}
                            </div>
                        </div>

                        {/* Digital Signature Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-sky-500 mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
                                Digital Signature
                            </h2>
                            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Please sign in the box below</p>
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium text-sm"
                                    >
                                        Clear Signature
                                    </button>
                                </div>
                                <div className="max-w-lg mx-auto">
                                    <div className="relative border-2 border-blue-600 rounded-xl bg-white dark:bg-gray-700 overflow-hidden shadow-sm">
                                        <canvas ref={canvasRef} width={520} height={180} className="w-full touch-none" />
                                        {!isSigned && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 dark:text-gray-500 text-xl font-medium">
                                                Sign here
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-start max-w-lg mx-auto">
                                    <input
                                        type="checkbox"
                                        id="agree"
                                        checked={isAgreed}
                                        onChange={(e) => setIsAgreed(e.target.checked)}
                                        className="h-4 w-4 text-sky-500 border-gray-300 rounded mt-1"
                                    />
                                    <label htmlFor="agree" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                        I have read and agree to the terms and conditions of this Service Agreement. I understand that by signing this agreement, I am legally bound to its terms.
                                    </label>
                                </div>

                                {/* Status indicator */}
                                <div className="mt-4 flex justify-center items-center text-sm">
                                    <span className={isSigned ? "bg-blue-100 text-sky-500 rounded-full px-3 py-1 font-medium" : "text-gray-500"}>
                                        {isSigned ? "✓ Signature captured" : "Signature required"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit button */}
                    <div className="mt-8">
                        <button
                            onClick={handleAccept}
                            disabled={isSubmitting || !isSigned || !isAgreed}
                            className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all shadow-md
                ${isSubmitting || !isSigned || !isAgreed
                                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                    : "bg-blue-700 hover:bg-blue-800 text-white active:scale-[0.98]"
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                                        <path
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            className="opacity-75"
                                        />
                                    </svg>
                                    Processing...
                                </div>
                            ) : (
                                "Accept & Continue"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}