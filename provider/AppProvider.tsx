"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/provider/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { decrypt } from "@/lib/crypto";

export default function AppProviders({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const encrypted = localStorage.getItem("access_token");

    if (encrypted) {
      const token = decrypt(encrypted);

      if (token) {
        useAuthStore.setState((state) => ({
          ...state,
          accessToken: token,
        }));
      }
    }

    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return <ThemeProvider>{children}</ThemeProvider>;
}
