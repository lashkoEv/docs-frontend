import type { DocumentRole } from '@/lib/documents';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface DocumentJoinPayload {
  documentId: number;
}

export interface DocumentLeavePayload {
  documentId: number;
}

export type DocumentJoinAck =
  | { ok: true; documentId: number; myRole: DocumentRole }
  | { ok: false; error: string };

export type DocumentLeaveAck = { ok: true } | { ok: false; error: string };

export interface PresenceHelloEvent {
  userId: number;
  documentId: number;
  joinedAt: string;
}

export interface RealtimeState {
  status: ConnectionStatus;
  errorMessage: string | null;
  joinedDocumentId: number | null;
  myRole: DocumentRole | null;
  setStatus: (status: ConnectionStatus, errorMessage?: string | null) => void;
  setJoined: (documentId: number, myRole: DocumentRole) => void;
  clearJoined: () => void;
  reset: () => void;
}