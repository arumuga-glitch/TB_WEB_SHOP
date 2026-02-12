export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors">

      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-gray-800 dark:to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-indigo-100 dark:text-gray-300 mb-6">
            Your privacy and data security are our top priorities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-indigo-200 dark:text-gray-400">
            <div>Effective Date: 07-07-2025</div>
            <div>Last Updated: 09-07-2025</div>
            <div>Platform: Thendral Booking</div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">

            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Introduction
            </h2>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Thendral Booking (“we,” “our,” or “us”) is committed to protecting
              your privacy in accordance with the Digital Personal Data Protection
              Act, 2023 of India and Google Play’s User Data policies.
            </p>

            <p className="text-gray-700 dark:text-gray-300 mb-10">
              By accessing or using our mobile app or website, you agree to the
              practices described in this Privacy Policy.
            </p>

            {/* Scope */}
            <Section title="Scope">
              <ul className="list-disc pl-6 space-y-2">
                <li>Access or register via our app or website</li>
                <li>Use our services or make payments</li>
                <li>Submit personal information through forms</li>
                <li>Redirected to external government portals</li>
              </ul>
            </Section>

            {/* Information Collection */}
            <Section title="Information We Collect">
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, phone number</li>
                <li>Location or address</li>
                <li>Service request details</li>
                <li>Transaction and booking data</li>
                <li>Device metadata (IP, OS, browser)</li>
              </ul>

              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 rounded">
                <strong className="text-red-700 dark:text-red-200">
                  We do NOT collect:
                </strong>
                <ul className="list-disc pl-6 mt-2 text-red-700 dark:text-red-300">
                  <li>Aadhaar numbers or OTPs</li>
                  <li>Biometric data</li>
                  <li>Government portal passwords</li>
                </ul>
              </div>
            </Section>

            {/* Usage */}
            <Section title="How We Use Your Information">
              <ul className="list-disc pl-6 space-y-2">
                <li>To connect you with service providers</li>
                <li>To process bookings and payments</li>
                <li>To send transactional notifications</li>
                <li>To improve app experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </Section>

            {/* Data Sharing */}
            <Section title="Data Sharing">
              <p>
                We do not sell your data. Information may be shared only with:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Authorized service providers</li>
                <li>Payment gateways</li>
                <li>Government portals (redirection only)</li>
                <li>Legal authorities if required</li>
              </ul>
            </Section>

            {/* Data Retention */}
            <Section title="Data Retention">
              <ul className="list-disc pl-6 space-y-2">
                <li>As long as required for service delivery</li>
                <li>As required by tax or legal regulations</li>
              </ul>
            </Section>

            {/* Rights */}
            <Section title="Your Rights">
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to access your data</li>
                <li>Right to correction</li>
                <li>Right to deletion</li>
                <li>Right to grievance redressal</li>
              </ul>
            </Section>

            {/* Children */}
            <Section title="Children’s Data">
              <p>
                Our services are not intended for users under 18 years of age.
              </p>
            </Section>

            {/* Security */}
            <Section title="Data Security">
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL encrypted communication</li>
                <li>Restricted internal access</li>
                <li>Role-based permissions</li>
                <li>Regular security audits</li>
              </ul>
            </Section>

            {/* Third Party */}
            <Section title="Third-Party Links">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <a
                    href="https://uidai.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    uidai.gov.in
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nvsp.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    nvsp.in
                  </a>
                </li>
                <li>
                  <a
                    href="https://tnreginet.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    tnreginet.gov.in
                  </a>
                </li>
              </ul>
            </Section>

            {/* Contact */}
            <Section title="Grievance Officer">
              <p>Email: support@thendralbooking.com</p>
              <p>Phone: +91 9361270767</p>
              <p>
                Address: 79/83, Cheran Towers, Govt Arts College Road,
                Coimbatore – 641018
              </p>
            </Section>

            {/* Governing Law */}
            <Section title="Governing Law">
              <p>
                This policy is governed by the laws of India. Jurisdiction:
                Coimbatore, Tamil Nadu.
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
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <div className="text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  )
}
