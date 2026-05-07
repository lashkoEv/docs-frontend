export const REALTIME_NAMESPACE = '/realtime';

export const realtimeEvents = {
  AUTH_ERROR: 'auth:error',
  PRESENCE_HELLO: 'presence:hello',
  DOCUMENT_JOIN: 'document:join',
  DOCUMENT_LEAVE: 'document:leave',
} as const;