import { apiClient } from '@/lib/api/client';

import type { NotificationsResponse } from './notifications.types';

export const notificationsApi = {
  list: (): Promise<NotificationsResponse> =>
    apiClient.get<NotificationsResponse>('/notifications'),

  markRead: (id: number): Promise<void> =>
    apiClient.patch<void>(`/notifications/${id}/read`),

  markAllRead: (): Promise<void> => apiClient.patch<void>('/notifications/read-all'),

  remove: (id: number): Promise<void> => apiClient.delete<void>(`/notifications/${id}`),

  removeAll: (): Promise<void> => apiClient.delete<void>('/notifications'),
};