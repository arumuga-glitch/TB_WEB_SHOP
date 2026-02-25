"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/provider/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { decrypt } from "@/lib/crypto";

export default function AppProviders({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 🧹 Cleanup stale/orphaned plain text keys from older versions
    const STALE_KEYS = ["role", "user", "theme-storage"];
    STALE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch { }
    });

    setHydrated(true);
  }, []);

  // During SSR and until hydration is complete, show a consistent non-interactive view
  // to prevent hydration mismatches.
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return <ThemeProvider>{children}</ThemeProvider>;
}
