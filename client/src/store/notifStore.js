import { create } from 'zustand'

const useNotifStore = create((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnread: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  setNotifications: (notifications) => set({ notifications }),
  prependNotification: (notif) =>
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  markAllRead: () =>
    set((s) => ({
      unreadCount: 0,
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
    })),
}))

export default useNotifStore
