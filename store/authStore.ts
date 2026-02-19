import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encrypt } from "@/lib/crypto";

export interface User {
  id: string;
  user_id: string;
  name: string;
  mobile_number: string;
  email_id: string;
  shop_name: string;
  mobile_verified: boolean;
  email_verified: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
  active: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  active: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;

  setAuth: (user: User, access: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, access) => {
        // Encrypt token and store separately
        const encrypted = encrypt(access);
        localStorage.setItem("access_token", encrypted);

        set({
          user,
          accessToken: access,
        });
      },

      logout: () => {
        // 🧹 Clear encrypted token
        localStorage.removeItem("access_token");

        set({
          user: null,
          accessToken: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
