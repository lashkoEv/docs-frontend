import { io, Socket } from 'socket.io-client';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth';
import { API_URL } from '@/lib/shared';

import { realtimeEvents, REALTIME_NAMESPACE } from './realtime.constants';
import { useRealtimeStore } from './realtime.store';
import type {
  DocumentJoinAck,
  DocumentLeaveAck,
  PresenceHelloEvent,
} from './realtime.types';

let socket: Socket | null = null;
let isRecoveringAuth = false;

const AUTH_ERROR_RE = /auth|token|jwt|unauthorized|expired/i;

const ensureSocket = (): Socket => {
  if (socket) return socket;

  socket = io(`${API_URL}${REALTIME_NAMESPACE}`, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    auth: (cb) => {
      const token = useAuthStore.getState().accessToken;
      cb({ token: token ?? '' });
    },
  });

  const store = useRealtimeStore;

  socket.on('connect', () => {
    isRecoveringAuth = false;
    store.getState().setStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') {
      store.getState().setStatus('idle');
    } else {
      store.getState().setStatus('reconnecting');
    }
  });

  socket.on('connect_error', async (error) => {
    const message = error.message ?? '';
    if (AUTH_ERROR_RE.test(message) && !isRecoveringAuth) {
      isRecoveringAuth = true;
      store.getState().setStatus('reconnecting');
      const refreshed = await apiClient.refreshTokens();
      isRecoveringAuth = false;
      if (refreshed) {
        return;
      }
    }
    store.getState().setStatus('error', message);
  });

  socket.on(realtimeEvents.AUTH_ERROR, (payload: { message: string }) => {
    store.getState().setStatus('error', payload.message);
  });

  socket.on(realtimeEvents.PRESENCE_HELLO, (event: PresenceHelloEvent) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[realtime] presence:hello', event);
    }
  });

  return socket;
};

const emitWithAck = <T>(event: string, payload: unknown, timeoutMs = 5000): Promise<T> => {
  const sock = ensureSocket();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime ack timeout')), timeoutMs);
    sock.emit(event, payload, (ack: T) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
};

export const realtimeClient = {
  connect(): void {
    const sock = ensureSocket();
    if (!sock.connected && !sock.active) {
      useRealtimeStore.getState().setStatus('connecting');
      sock.connect();
    } else if (sock.active && !sock.connected) {
      useRealtimeStore.getState().setStatus('connecting');
    }
  },

  disconnect(): void {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    useRealtimeStore.getState().reset();
  },

  async joinDocument(documentId: number): Promise<DocumentJoinAck> {
    realtimeClient.connect();
    const ack = await emitWithAck<DocumentJoinAck>(realtimeEvents.DOCUMENT_JOIN, {
      documentId,
    });
    if (ack.ok) {
      useRealtimeStore.getState().setJoined(ack.documentId, ack.myRole);
    } else {
      useRealtimeStore.getState().setStatus('error', ack.error);
    }
    return ack;
  },

  async leaveDocument(documentId: number): Promise<DocumentLeaveAck> {
    if (!socket || !socket.connected) {
      useRealtimeStore.getState().clearJoined();
      return { ok: true };
    }
    const ack = await emitWithAck<DocumentLeaveAck>(realtimeEvents.DOCUMENT_LEAVE, {
      documentId,
    });
    useRealtimeStore.getState().clearJoined();
    return ack;
  },
};