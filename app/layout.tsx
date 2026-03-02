import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AppProviders from "@/components/common/provider/AppProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thendral Booking",
  description: "Book your appointments with ease",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <AppProviders>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#363636", color: "#fff" },
              success: { duration: 3000, style: { background: "#10b981" } },
              error: { duration: 4000, style: { background: "#ef4444" } },
            }}
          />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

