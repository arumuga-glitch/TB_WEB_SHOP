import { create } from "zustand";
import { getShopByUser, toggleShopOnline } from "@/lib/api";
import api from "@/lib/api";

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

interface ShopStore {
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

export const useShopStore = create<ShopStore>((set, get) => ({
  shop: null,
  loading: false,
  error: null,
  toggleLoading: false,

  setShop: (shop) => set({ shop, error: null }),

  fetchShopByUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const shop = await getShopByUser(userId);
      set({ shop, loading: false });
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch shop",
        loading: false,
      });
    }
  },

  toggleOnline: async (nextStatus: boolean) => {
    const { shop, toggleLoading } = get();
    if (!shop || toggleLoading) return;

    const previousStatus = shop.is_online;

    // 1. Lock + optimistic UI update
    set({
      toggleLoading: true,
      shop: { ...shop, is_online: nextStatus },
      error: null,
    });

    try {
      const response = await toggleShopOnline(shop.id, {
        is_online: nextStatus,
      });

      // 2. Confirm with server value (defensive)
      set({
        shop: { ...shop, is_online: response.is_online ?? nextStatus },
      });
    } catch (err: any) {
      // 3. Rollback + show error
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

    // optimistic
    set({
      shop: { ...shop, address, latitude, longitude },
    });

    try {
      await api.put(`/shop/update/${shop.id}`, {
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
}));