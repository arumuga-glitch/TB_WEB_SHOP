"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/common/provider/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { decrypt } from "@/lib/crypto";
import FCMNotification from "@/components/FCMNotification";

export default function AppProviders({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 🧹 Cleanup stale/orphaned plain text keys from older versions
    const STALE_KEYS = ["role", "user", "theme-storage"];
    STALE_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch { }
    });

    /**
     * 🔄 MULTI-TAB SESSION SYNC
     * If the user logs out in one tab, immediately log out in all others.
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-storage") {
        // Wait a tick for Zustand persist to sync the new value into the store
        // before deciding whether the token is gone.
        setTimeout(() => {
          const state = useAuthStore.getState();
          if (!state.accessToken && window.location.pathname !== "/" && !window.location.pathname.startsWith("/login")) {
            window.location.replace("/?reason=tab_logout");
          }
        }, 200);
      }
    };

    /**
     * 📱 RESUME APP SYNC
     * When the user returns to the tab after using other apps.
     * We use a small delay so that Zustand's localStorage hydration completes
     * before we check the token — otherwise we'd redirect even when session is valid.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Small delay to let Zustand rehydrate from localStorage before checking
        setTimeout(() => {
          const state = useAuthStore.getState();
          // Only redirect if on a protected route AND truly no token
          if (!state.accessToken && window.location.pathname.startsWith("/dashboard")) {
            window.location.replace("/?reason=session_lost");
          }
        }, 300);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    setHydrated(true);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  return (
    <ThemeProvider>
      <FCMNotification />
      {children}
    </ThemeProvider>
  );
}
