import type { DocumentRole } from '@/lib/documents';

export enum NotificationType {
  ACCESS_GRANTED = 1,
  ROLE_CHANGED = 2,
  ACCESS_REVOKED = 3,
}

export interface NotificationPayload {
  documentId: number;
  documentTitle: string;
  role?: DocumentRole | null;
}

export interface Notification {
  id: number;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
}