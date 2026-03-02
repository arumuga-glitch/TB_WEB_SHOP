import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { encrypt, decrypt } from "@/lib/crypto";

export interface UserRole {
  id: string;
  name: string;
  active: boolean;
}

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (user: User, access: string, refresh?: string | null) => void;
  setToken: (access: string, refresh?: string | null) => void;
  logout: () => void;
}

/**
 * 🔒 CUSTOM ENCRYPTED STORAGE
 * This ensures that even the 'auth-storage' key in localStorage
 * is encrypted and unreadable to prying eyes.
 */
const encryptedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const encryptedValue = localStorage.getItem(name);
    if (!encryptedValue) return null;
    try {
      return decrypt(encryptedValue);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encryptedValue = encrypt(value);
    localStorage.setItem(name, encryptedValue);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, access, refresh) => {
        set({
          user,
          accessToken: access,
          refreshToken: refresh || null,
        });
      },

      setToken: (access, refresh) => {
        set((state) => ({
          accessToken: access,
          refreshToken: refresh !== undefined ? refresh : state.refreshToken
        }));
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
