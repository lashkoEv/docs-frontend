import { create } from 'zustand';

import { nowIso } from '@/lib/shared';

import { notificationsApi } from './notifications.api';
import type { Notification } from './notifications.types';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoaded: boolean;

  fetch: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
  removeAll: () => Promise<void>;
  pushNew: (notification: Notification) => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  hasLoaded: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationsApi.list();
      set({
        items: response.items,
        unreadCount: response.unreadCount,
        isLoading: false,
        hasLoaded: true,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target || target.readAt) {
      return;
    }
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, readAt: nowIso() } : item,
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
    try {
      await notificationsApi.markRead(id);
    } catch {
      void get().fetch();
    }
  },

  markAllRead: async () => {
    if (get().unreadCount === 0) {
      return;
    }
    const readAt = nowIso();
    set({
      items: get().items.map((item) => (item.readAt ? item : { ...item, readAt })),
      unreadCount: 0,
    });
    try {
      await notificationsApi.markAllRead();
    } catch {
      void get().fetch();
    }
  },

  remove: async (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target) {
      return;
    }
    set({
      items: get().items.filter((item) => item.id !== id),
      unreadCount: target.readAt ? get().unreadCount : Math.max(0, get().unreadCount - 1),
    });
    try {
      await notificationsApi.remove(id);
    } catch {
      void get().fetch();
    }
  },

  removeAll: async () => {
    if (get().items.length === 0) {
      return;
    }
    set({ items: [], unreadCount: 0 });
    try {
      await notificationsApi.removeAll();
    } catch {
      void get().fetch();
    }
  },

  pushNew: (notification) => {
    if (get().items.some((item) => item.id === notification.id)) {
      return;
    }
    set({
      items: [notification, ...get().items],
      unreadCount: get().unreadCount + (notification.readAt ? 0 : 1),
    });
  },

  reset: () => set({ items: [], unreadCount: 0, isLoading: false, hasLoaded: false }),
}));