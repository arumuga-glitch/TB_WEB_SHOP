export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors">

      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-gray-800 dark:to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms and Conditions
          </h1>
          <p className="text-xl text-indigo-100 dark:text-gray-300 mb-6">
            Please read these terms and conditions carefully before using our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-indigo-200">
            <div>Platform: Thendral Booking</div>
            <div>Last Updated: 09-07-2025</div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">

            <Section title="Introduction">
              <p>
                Welcome to Thendral Booking. These Terms and Conditions govern your
                use of our platform and services. By accessing or using our platform,
                you agree to be bound by these terms.
              </p>
              <p className="mt-3">
                Thendral Booking acts only as a facilitator connecting customers
                with relevant service providers.
              </p>
            </Section>

            <Section title="Role of the Platform">
              <p>
                The Platform acts only as a facilitator and does not verify,
                endorse, or guarantee the quality or completion of services.
              </p>
            </Section>

            <AlertSection title="No Guarantee or Warranty" type="error">
              The Platform does not provide any warranty or assurance on the
              services rendered by service providers.
            </AlertSection>

            <AlertSection title="No Document Handling or Verification" type="warning">
              The Platform does not verify the authenticity or completeness of
              documents submitted by customers.
            </AlertSection>

            <Section title="Payments and Charges">
              <p>
                A non-refundable service fee of ₹10 (inclusive of GST) is charged
                per successful booking.
              </p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 rounded">
                Government fees are collected on behalf of authorities and are not
                income of the Platform.
              </div>
            </Section>

            <AlertSection title="Limitation of Liability" type="error">
              The Platform shall not be liable for delays, errors, or service
              rejections caused by service providers or document inaccuracies.
            </AlertSection>

            <Section title="Independent Service Providers">
              <p>
                All service providers are independent entities. The Platform does
                not act as an agent or representative.
              </p>
            </Section>

            <AlertSection title="Dispute Resolution" type="info">
              Disputes shall be resolved directly between the customer and the
              service provider.
            </AlertSection>

            <Section title="Data Privacy">
              <p>
                Only necessary data is collected for service facilitation. No
                sensitive personal data is retained beyond operational needs.
              </p>
            </Section>

            <AlertSection title="Modification of Services" type="warning">
              The Platform reserves the right to modify or discontinue services
              without prior notice.
            </AlertSection>

            <Section title="Governing Law">
              <p>
                These Terms are governed by the laws of India. Jurisdiction lies
                exclusively with courts in Coimbatore, Tamil Nadu.
              </p>
            </Section>

            <Section title="Contact Information">
              <p>Email: support@thendralbooking.com</p>
              <p>Phone: +91 9361270767</p>
              <p>
                Address: 79/83, Ground Floor, Cheran Towers, Govt Arts College Road,
                Gopalapuram, Coimbatore – 641018
              </p>
            </Section>

          </div>
        </div>
      </section>
    </div>
  )
}


function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <div className="text-gray-700 dark:text-gray-300 space-y-2">
        {children}
      </div>
    </section>
  )
}

function AlertSection({
  title,
  type,
  children,
}: {
  title: string
  type: "error" | "warning" | "info"
  children: React.ReactNode
}) {
  const styles = {
    error: "bg-red-50 dark:bg-red-900 border-red-400",
    warning: "bg-yellow-50 dark:bg-yellow-900 border-yellow-400",
    info: "bg-blue-50 dark:bg-blue-900 border-blue-400",
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <div className={`p-4 border-l-4 rounded ${styles[type]}`}>
        <p className="text-gray-700 dark:text-gray-300">{children}</p>
      </div>
    </section>
  )
}
