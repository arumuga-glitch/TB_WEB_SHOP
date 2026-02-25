import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { encrypt, decrypt } from "@/lib/crypto";
import { getShopByUser, toggleShopOnline } from "@/lib/api";
import api from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

export interface ShopUser {
  id: string;
  name: string;
}

export interface ShopData {
  id: string;
  shop_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  wallet_amount: number;
  active: boolean;
  is_online: boolean;
  service_agreement: string | null;
  created_at: string;
  updated_at: string;
  user: ShopUser;
}

export interface ShopStore {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
  toggleLoading: boolean;

  setShop: (shop: ShopData | null) => void;
  fetchShopByUser: (userId: string) => Promise<void>;

  toggleOnline: (nextStatus: boolean) => Promise<void>;

  updateShopAddress: (
    address: string,
    latitude: number,
    longitude: number
  ) => Promise<void>;
}

// Custom encrypted storage for Shop data
const shopEncryptedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const val = localStorage.getItem(name);
      return val ? decrypt(val) : null;
    } catch { return null; }
  },
  setItem: (name: string, value: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(name, encrypt(value));
  },
  removeItem: (name: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      shop: null,
      loading: false,
      error: null,
      toggleLoading: false,

      setShop: (shop) => set({ shop, error: null }),

      fetchShopByUser: async (userId: string) => {
        // Prevent redundant fetching if shop is already loaded for this user
        if (get().shop?.user?.id === userId && !get().error) return;

        set({ loading: true, error: null });
        try {
          const shop = await getShopByUser(userId);
          set({ shop, loading: false });
        } catch (err: any) {
          set({
            error: err.message || "Failed to fetch shop",
            loading: false,
            shop: null,
          });
        }
      },

      toggleOnline: async (nextStatus: boolean) => {
        const { shop, toggleLoading } = get();
        if (!shop || toggleLoading) return;

        const previousStatus = shop.is_online;
        set({
          toggleLoading: true,
          shop: { ...shop, is_online: nextStatus },
          error: null,
        });

        try {
          const response = await toggleShopOnline(shop.id, {
            is_online: nextStatus,
          });
          set({
            shop: { ...shop, is_online: response.is_online ?? nextStatus },
          });
        } catch (err: any) {
          set({
            shop: { ...shop, is_online: previousStatus },
            error: err.message || "Failed to update online status",
          });
        } finally {
          set({ toggleLoading: false });
        }
      },

      updateShopAddress: async (address, latitude, longitude) => {
        const shop = get().shop;
        if (!shop) return;

        const previous = {
          address: shop.address,
          latitude: shop.latitude,
          longitude: shop.longitude,
        };

        set({
          shop: { ...shop, address, latitude, longitude },
        });

        try {
          await api.put(ENDPOINTS.SHOP.UPDATE(shop.id), {
            name: shop.name,
            address,
            latitude,
            longitude,
          });
        } catch (err) {
          set({
            shop: { ...shop, ...previous },
            error: "Failed to update shop address",
          });
          throw err;
        }
      },
    }),
    {
      name: "shop-storage",
      storage: createJSONStorage(() => shopEncryptedStorage),
    }
  )
);