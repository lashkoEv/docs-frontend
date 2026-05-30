export const REALTIME_NAMESPACE = '/realtime';

export const realtimeEvents = {
  AUTH_ERROR: 'auth:error',
  PRESENCE_HELLO: 'presence:hello',
  DOCUMENT_JOIN: 'document:join',
  DOCUMENT_LEAVE: 'document:leave',
  DOCUMENT_OPERATION: 'document:operation',
  DOCUMENT_CATCHUP: 'document:catchup',
  DOCUMENT_ROLE_CHANGED: 'document:role-changed',
  DOCUMENT_LIST_CHANGED: 'document:list-changed',
} as const;

export const otBackoff = {
  baseDelayMs: 200,
  maxDelayMs: 4000,
} as const;

export const RATE_LIMITED_RE = /rate.?limit/i;