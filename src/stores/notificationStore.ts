import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: number;
  type: 'payment' | 'transfer' | 'security' | 'info' | 'achievement' | 'budget_card' | 'dark_days';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: string;
  color: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 1,
          type: 'transfer',
          title: 'Money Received',
          message: 'You received $50.00 from @john_doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          read: false,
          icon: 'DollarSign',
          color: 'green',
        },
        {
          id: 2,
          type: 'payment',
          title: 'Payment Successful',
          message: 'Your top-up of $100.00 was successful',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
          icon: 'CreditCard',
          color: 'blue',
        },
      ],
      unreadCount: 2,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now(),
          read: false,
          timestamp: new Date(),
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return { notifications: updatedNotifications, unreadCount };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter((n) => n.id !== id);
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return { notifications: updatedNotifications, unreadCount };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);
