import { io, Socket } from 'socket.io-client';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth';
import type { Notification } from '@/lib/notifications';
import { API_URL } from '@/lib/shared';

import {
  AUTH_ERROR_RE,
  REALTIME_ACK_TIMEOUT_MS,
  realtimeEvents,
  REALTIME_NAMESPACE,
  socketReconnect,
} from './realtime.constants';
import { useRealtimeStore } from './realtime.store';
import type {
  DocumentCatchupAck,
  DocumentCatchupPayload,
  DocumentJoinAck,
  DocumentLeaveAck,
  DocumentListChangedEvent,
  DocumentOperationAck,
  DocumentOperationBroadcast,
  DocumentDeletedEvent,
  DocumentOperationPayload,
  DocumentResyncEvent,
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
let consumers = 0;

type RemoteOperationHandler = (event: DocumentOperationBroadcast) => void;
type ResyncHandler = (event: DocumentResyncEvent) => void;
type DeletedHandler = (event: DocumentDeletedEvent) => void;
type RoleChangedHandler = (event: DocumentRoleChangedEvent) => void;
type ListChangedHandler = (event: DocumentListChangedEvent) => void;
type PresenceStateHandler = (event: PresenceStateEvent) => void;
type PresenceJoinedHandler = (event: PresenceJoinedEvent) => void;
type PresenceLeftHandler = (event: PresenceLeftEvent) => void;
type PresenceCursorHandler = (event: PresenceCursorEvent) => void;
type NotificationNewHandler = (notification: Notification) => void;
type ConnectionHandler = () => void;

const remoteOperationHandlers = new Set<RemoteOperationHandler>();
const resyncHandlers = new Set<ResyncHandler>();
const deletedHandlers = new Set<DeletedHandler>();
const roleChangedHandlers = new Set<RoleChangedHandler>();
const listChangedHandlers = new Set<ListChangedHandler>();
const presenceStateHandlers = new Set<PresenceStateHandler>();
const presenceJoinedHandlers = new Set<PresenceJoinedHandler>();
const presenceLeftHandlers = new Set<PresenceLeftHandler>();
const presenceCursorHandlers = new Set<PresenceCursorHandler>();
const notificationNewHandlers = new Set<NotificationNewHandler>();
const connectionLostHandlers = new Set<ConnectionHandler>();
const reconnectedHandlers = new Set<ConnectionHandler>();

const emit = <Event>(handlers: Set<(event: Event) => void>, event: Event): void => {
  handlers.forEach((handler) => handler(event));
};

const attemptReconnect = (): void => {
  if (!socket) {
    return;
  }
  if (socket.connected || socket.active) {
    return;
  }
  socket.connect();
};

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
    reconnectionDelay: socketReconnect.delayMs,
    reconnectionDelayMax: socketReconnect.delayMaxMs,
    auth: (callback) => {
      const token = useAuthStore.getState().accessToken;
      callback({ token: token ?? '' });
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
      return;
    }
    store.getState().setStatus('reconnecting');
    connectionLostHandlers.forEach((handler) => handler());
    if (reason === 'io server disconnect') {
      attemptReconnect();
    }
  });

  socket.on('connect_error', async (error) => {
    const message = error.message ?? '';
    store.getState().setStatus('reconnecting');

    if (!AUTH_ERROR_RE.test(message) || isRecoveringAuth) {
      return;
    }

    isRecoveringAuth = true;
    const refreshed = await apiClient.refreshTokens();
    isRecoveringAuth = false;
    if (refreshed) {
      attemptReconnect();
    } else {
      store.getState().setStatus('error', 'Session expired');
    }
  });

  socket.on(realtimeEvents.AUTH_ERROR, (payload: { message: string }) => {
    store.getState().setStatus('error', payload.message);
  });

  socket.on(realtimeEvents.PRESENCE_STATE, (event: PresenceStateEvent) => {
    emit(presenceStateHandlers, event);
  });

  socket.on(realtimeEvents.PRESENCE_JOINED, (event: PresenceJoinedEvent) => {
    emit(presenceJoinedHandlers, event);
  });

  socket.on(realtimeEvents.PRESENCE_LEFT, (event: PresenceLeftEvent) => {
    emit(presenceLeftHandlers, event);
  });

  socket.on(realtimeEvents.PRESENCE_CURSOR, (event: PresenceCursorEvent) => {
    emit(presenceCursorHandlers, event);
  });

  socket.on(
    realtimeEvents.DOCUMENT_OPERATION,
    (event: DocumentOperationBroadcast) => {
      emit(remoteOperationHandlers, event);
    },
  );

  socket.on(realtimeEvents.DOCUMENT_RESYNC, (event: DocumentResyncEvent) => {
    emit(resyncHandlers, event);
  });

  socket.on(realtimeEvents.DOCUMENT_DELETED, (event: DocumentDeletedEvent) => {
    emit(deletedHandlers, event);
  });

  socket.on(
    realtimeEvents.DOCUMENT_ROLE_CHANGED,
    (event: DocumentRoleChangedEvent) => {
      const state = store.getState();
      if (state.joinedDocumentId === event.documentId) {
        state.setMyRole(event.role);
      }
      emit(roleChangedHandlers, event);
    },
  );

  socket.on(
    realtimeEvents.DOCUMENT_LIST_CHANGED,
    (event: DocumentListChangedEvent) => {
      emit(listChangedHandlers, event);
    },
  );

  socket.on(realtimeEvents.NOTIFICATION_NEW, (notification: Notification) => {
    emit(notificationNewHandlers, notification);
  });

  return socket;
};

const emitWithAck = <T>(
  event: string,
  payload: unknown,
  timeoutMs = REALTIME_ACK_TIMEOUT_MS,
): Promise<T> => {
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

  acquire(): void {
    consumers += 1;
    realtimeClient.connect();
  },

  release(): void {
    if (consumers > 0) {
      consumers -= 1;
    }
    if (consumers === 0) {
      realtimeClient.disconnect();
    }
  },

  disconnect(): void {
    consumers = 0;
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

  onDocumentResync(handler: ResyncHandler): () => void {
    resyncHandlers.add(handler);
    return () => {
      resyncHandlers.delete(handler);
    };
  },

  onDocumentDeleted(handler: DeletedHandler): () => void {
    deletedHandlers.add(handler);
    return () => {
      deletedHandlers.delete(handler);
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

  onNotificationNew(handler: NotificationNewHandler): () => void {
    notificationNewHandlers.add(handler);
    return () => {
      notificationNewHandlers.delete(handler);
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