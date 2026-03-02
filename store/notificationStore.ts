import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
    id: string;
    title: string;
    body: string;
    time: string;
    unread: boolean;
    type?: 'news' | 'alerts';
    data?: any;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'time' | 'unread'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            unreadCount: 0,

            addNotification: (newNotif) => {
                const notification: Notification = {
                    ...newNotif,
                    id: Math.random().toString(36).substring(7),
                    time: new Date().toISOString(),
                    unread: true,
                };

                set((state) => ({
                    notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
                    unreadCount: state.unreadCount + 1,
                }));
            },

            markAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, unread: false } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                }));
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, unread: false })),
                    unreadCount: 0,
                }));
            },

            clearAll: () => {
                set({ notifications: [], unreadCount: 0 });
            },
        }),
        {
            name: 'notification-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
