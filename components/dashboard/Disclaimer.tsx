"use client";

interface DisclaimerDialogProps {
  onAccept: () => void;
}

export default function DisclaimerDialog({ onAccept }: DisclaimerDialogProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Disclaimer
          </h2>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto text-sm text-gray-700 dark:text-gray-300 space-y-3 sm:space-y-4 leading-relaxed">
          <p>
            <strong>Thendral Booking</strong> is not affiliated with or representing
            any government entity. This app serves only as a mediator between users
            and nearby registered service centers (e.g., e-Sevai centers).
          </p>

          <p>
            We do not provide or process government services directly, nor do we
            link to or store any government portals or databases.
          </p>

          <p>
            <strong>Purpose and Use:</strong> Thendral Booking helps users locate
            and connect with nearby service centers to access commonly needed
            services and schemes. Actual service delivery is handled by the
            respective service centers.
          </p>

          <p>
            <strong>Data Collection and Privacy:</strong> We collect only minimal
            user information necessary to provide updates and notifications. No
            user data is shared, sold, or misused.
          </p>

          <p>
            <strong>Liability:</strong> Thendral Booking does not process government
            applications or handle payments for official services. We are not
            responsible for delays, inaccuracies, or failures at third-party
            service centers.
          </p>

          <p>
            <strong>Ownership and Rights:</strong> All government-related services
            and documents belong to their respective authorities or authorized
            centers.
          </p>

          <p>
            <strong>Clarification on Links:</strong> Thendral Booking does not embed
            or use government website links. We only redirect users to nearby
            service providers based on location or request.
          </p>

          <p>
            <strong>Feedback & Support:</strong><br />
            📧 support@thendralbooking.com
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onAccept}
            className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}