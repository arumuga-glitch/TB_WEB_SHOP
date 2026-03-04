"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
    const router = useRouter();
    const accessToken = useAuthStore((s) => s.accessToken);

    useEffect(() => {
        // Wait one tick for Zustand to hydrate from localStorage before deciding
        const timer = setTimeout(() => {
            if (accessToken) {
                router.replace("/dashboard");
            } else {
                router.replace("/login");
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [accessToken, router]);

    // Show a neutral spinner while we decide where to go
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
    );
}
