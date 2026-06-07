export const REALTIME_NAMESPACE = '/realtime';

export const realtimeEvents = {
  AUTH_ERROR: 'auth:error',
  DOCUMENT_JOIN: 'document:join',
  DOCUMENT_LEAVE: 'document:leave',
  DOCUMENT_OPERATION: 'document:operation',
  DOCUMENT_CATCHUP: 'document:catchup',
  DOCUMENT_RESYNC: 'document:resync',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_ROLE_CHANGED: 'document:role-changed',
  DOCUMENT_LIST_CHANGED: 'document:list-changed',
  PRESENCE_STATE: 'presence:state',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',
  PRESENCE_CURSOR: 'presence:cursor',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const otBackoff = {
  baseDelayMs: 200,
  maxDelayMs: 4000,
} as const;

export const OT_PERSIST_DEBOUNCE_MS = 500;

export const RATE_LIMITED_RE = /rate.?limit/i;

export const PRESENCE_CURSOR_THROTTLE_MS = 150;

export const PRESENCE_CURSOR_IDLE_MS = 15000;