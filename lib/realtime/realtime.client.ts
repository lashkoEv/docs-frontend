import { io, Socket } from 'socket.io-client';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth';
import { API_URL } from '@/lib/shared';

import { realtimeEvents, REALTIME_NAMESPACE } from './realtime.constants';
import { useRealtimeStore } from './realtime.store';
import type {
  DocumentCatchupAck,
  DocumentCatchupPayload,
  DocumentJoinAck,
  DocumentLeaveAck,
  DocumentListChangedEvent,
  DocumentOperationAck,
  DocumentOperationBroadcast,
  DocumentOperationPayload,
  DocumentRoleChangedEvent,
  PresenceCursorEvent,
  PresenceJoinedEvent,
  PresenceLeftEvent,
  PresenceRange,
  PresenceStateEvent,
} from './realtime.types';

let socket: Socket | null = null;
let isRecoveringAuth = false;
let hasEstablishedConnection = false;

const AUTH_ERROR_RE = /auth|token|jwt|unauthorized|expired/i;

type RemoteOperationHandler = (event: DocumentOperationBroadcast) => void;
type RoleChangedHandler = (event: DocumentRoleChangedEvent) => void;
type ListChangedHandler = (event: DocumentListChangedEvent) => void;
type PresenceStateHandler = (event: PresenceStateEvent) => void;
type PresenceJoinedHandler = (event: PresenceJoinedEvent) => void;
type PresenceLeftHandler = (event: PresenceLeftEvent) => void;
type PresenceCursorHandler = (event: PresenceCursorEvent) => void;
type ConnectionHandler = () => void;

const remoteOperationHandlers = new Set<RemoteOperationHandler>();
const roleChangedHandlers = new Set<RoleChangedHandler>();
const listChangedHandlers = new Set<ListChangedHandler>();
const presenceStateHandlers = new Set<PresenceStateHandler>();
const presenceJoinedHandlers = new Set<PresenceJoinedHandler>();
const presenceLeftHandlers = new Set<PresenceLeftHandler>();
const presenceCursorHandlers = new Set<PresenceCursorHandler>();
const connectionLostHandlers = new Set<ConnectionHandler>();
const reconnectedHandlers = new Set<ConnectionHandler>();

const rejoinAfterReconnect = async (documentId: number): Promise<void> => {
  try {
    const ack = await emitWithAck<DocumentJoinAck>(realtimeEvents.DOCUMENT_JOIN, {
      documentId,
    });
    if (!ack.ok) {
      useRealtimeStore.getState().setStatus('error', ack.error);
      return;
    }
    useRealtimeStore.getState().setJoined(ack.documentId, ack.myRole);
    reconnectedHandlers.forEach((handler) => handler());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reconnect failed';
    useRealtimeStore.getState().setStatus('error', message);
  }
};

const ensureSocket = (): Socket => {
  if (socket) {
    return socket;
  }

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
    const isReconnect = hasEstablishedConnection;
    hasEstablishedConnection = true;
    isRecoveringAuth = false;
    store.getState().setStatus('connected');

    if (isReconnect) {
      const documentId = store.getState().joinedDocumentId;
      if (documentId !== null) {
        void rejoinAfterReconnect(documentId);
      }
    }
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') {
      store.getState().setStatus('idle');
    } else {
      store.getState().setStatus('reconnecting');
      connectionLostHandlers.forEach((handler) => handler());
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

  socket.on(realtimeEvents.PRESENCE_STATE, (event: PresenceStateEvent) => {
    presenceStateHandlers.forEach((handler) => handler(event));
  });

  socket.on(realtimeEvents.PRESENCE_JOINED, (event: PresenceJoinedEvent) => {
    presenceJoinedHandlers.forEach((handler) => handler(event));
  });

  socket.on(realtimeEvents.PRESENCE_LEFT, (event: PresenceLeftEvent) => {
    presenceLeftHandlers.forEach((handler) => handler(event));
  });

  socket.on(realtimeEvents.PRESENCE_CURSOR, (event: PresenceCursorEvent) => {
    presenceCursorHandlers.forEach((handler) => handler(event));
  });

  socket.on(
    realtimeEvents.DOCUMENT_OPERATION,
    (event: DocumentOperationBroadcast) => {
      remoteOperationHandlers.forEach((handler) => handler(event));
    },
  );

  socket.on(
    realtimeEvents.DOCUMENT_ROLE_CHANGED,
    (event: DocumentRoleChangedEvent) => {
      const state = store.getState();
      if (state.joinedDocumentId === event.documentId) {
        state.setMyRole(event.role);
      }
      roleChangedHandlers.forEach((handler) => handler(event));
    },
  );

  socket.on(
    realtimeEvents.DOCUMENT_LIST_CHANGED,
    (event: DocumentListChangedEvent) => {
      listChangedHandlers.forEach((handler) => handler(event));
    },
  );

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
    hasEstablishedConnection = false;
    useRealtimeStore.getState().reset();
  },

  socketId(): string | null {
    return socket?.id ?? null;
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

  async sendOperation(
    payload: Omit<DocumentOperationPayload, 'clientId'>,
  ): Promise<DocumentOperationAck> {
    const clientId = realtimeClient.socketId();
    if (!clientId) {
      return { ok: false, error: 'Not connected' };
    }
    return emitWithAck<DocumentOperationAck>(realtimeEvents.DOCUMENT_OPERATION, {
      ...payload,
      clientId,
    });
  },

  async requestCatchup(payload: DocumentCatchupPayload): Promise<DocumentCatchupAck> {
    return emitWithAck<DocumentCatchupAck>(realtimeEvents.DOCUMENT_CATCHUP, payload);
  },

  onRemoteOperation(handler: RemoteOperationHandler): () => void {
    remoteOperationHandlers.add(handler);
    return () => {
      remoteOperationHandlers.delete(handler);
    };
  },

  onRoleChanged(handler: RoleChangedHandler): () => void {
    roleChangedHandlers.add(handler);
    return () => {
      roleChangedHandlers.delete(handler);
    };
  },

  onDocumentListChanged(handler: ListChangedHandler): () => void {
    listChangedHandlers.add(handler);
    return () => {
      listChangedHandlers.delete(handler);
    };
  },

  sendCursor(documentId: number, range: PresenceRange | null): void {
    if (!socket?.connected) {
      return;
    }
    socket.emit(realtimeEvents.PRESENCE_CURSOR, { documentId, range });
  },

  onPresenceState(handler: PresenceStateHandler): () => void {
    presenceStateHandlers.add(handler);
    return () => {
      presenceStateHandlers.delete(handler);
    };
  },

  onPresenceJoined(handler: PresenceJoinedHandler): () => void {
    presenceJoinedHandlers.add(handler);
    return () => {
      presenceJoinedHandlers.delete(handler);
    };
  },

  onPresenceLeft(handler: PresenceLeftHandler): () => void {
    presenceLeftHandlers.add(handler);
    return () => {
      presenceLeftHandlers.delete(handler);
    };
  },

  onPresenceCursor(handler: PresenceCursorHandler): () => void {
    presenceCursorHandlers.add(handler);
    return () => {
      presenceCursorHandlers.delete(handler);
    };
  },

  onConnectionLost(handler: ConnectionHandler): () => void {
    connectionLostHandlers.add(handler);
    return () => {
      connectionLostHandlers.delete(handler);
    };
  },

  onReconnected(handler: ConnectionHandler): () => void {
    reconnectedHandlers.add(handler);
    return () => {
      reconnectedHandlers.delete(handler);
    };
  },
};