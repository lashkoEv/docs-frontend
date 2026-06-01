import type Delta from 'quill-delta';

import type { DocumentContentJson, DocumentRole } from '@/lib/documents';

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

export interface DocumentSnapshot {
  revision: number;
  content: DocumentContentJson;
}

export type DocumentJoinAck =
  | {
      ok: true;
      documentId: number;
      myRole: DocumentRole;
      revision: number;
      content: DocumentContentJson;
    }
  | { ok: false; error: string };

export type DocumentLeaveAck = { ok: true } | { ok: false; error: string };

export interface DocumentOperationPayload {
  documentId: number;
  baseRevision: number;
  delta: DocumentContentJson;
  clientId: string;
}

export type DocumentOperationAck =
  | {
      ok: true;
      documentId: number;
      revision: number;
      transformedDelta: DocumentContentJson;
    }
  | { ok: false; error: string };

export interface DocumentOperationBroadcast {
  documentId: number;
  revision: number;
  delta: DocumentContentJson;
  userId: number;
  clientId: string;
}

export interface DocumentCatchupPayload {
  documentId: number;
  sinceRevision: number;
}

export interface DocumentCatchupOp {
  revision: number;
  delta: DocumentContentJson;
  userId: number;
  clientId: string;
}

export type DocumentCatchupAck =
  | {
      ok: true;
      action: 'ops';
      documentId: number;
      ops: DocumentCatchupOp[];
      currentRevision: number;
    }
  | {
      ok: true;
      action: 'full-resync';
      documentId: number;
      currentRevision: number;
      content: DocumentContentJson;
    }
  | { ok: false; error: string };

export interface DocumentRoleChangedEvent {
  documentId: number;
  userId: number;
  role: DocumentRole | null;
}

export interface DocumentListChangedEvent {
  documentId: number;
  role: DocumentRole | null;
}

export interface PresenceParticipant {
  userId: number;
  socketId: string;
  displayName: string;
  color: string;
}

export interface PresenceRange {
  index: number;
  length: number;
}

export interface PresenceStateEvent {
  documentId: number;
  participants: PresenceParticipant[];
}

export interface PresenceJoinedEvent {
  documentId: number;
  participant: PresenceParticipant;
}

export interface PresenceLeftEvent {
  documentId: number;
  socketId: string;
  userId: number;
}

export interface PresenceCursorEvent {
  documentId: number;
  socketId: string;
  userId: number;
  range: PresenceRange | null;
}

export interface RealtimeState {
  status: ConnectionStatus;
  errorMessage: string | null;
  joinedDocumentId: number | null;
  myRole: DocumentRole | null;
  setStatus: (status: ConnectionStatus, errorMessage?: string | null) => void;
  setJoined: (documentId: number, myRole: DocumentRole) => void;
  setMyRole: (role: DocumentRole | null) => void;
  clearJoined: () => void;
  reset: () => void;
}

export type OtStatus = 'idle' | 'sending' | 'syncing' | 'error';

export interface OtClientState {
  revision: number;
  status: OtStatus;
  errorMessage: string | null;
  hasPending: boolean;
}

export interface OtSendResult {
  ok: boolean;
  error?: string;
  revision?: number;
  transformedDelta?: DocumentContentJson;
}

export type OtSendFn = (payload: {
  baseRevision: number;
  delta: DocumentContentJson;
}) => Promise<OtSendResult>;

export type OtCatchupResult =
  | {
      ok: true;
      action: 'ops';
      ops: DocumentCatchupOp[];
      currentRevision: number;
    }
  | {
      ok: true;
      action: 'full-resync';
      content: DocumentContentJson;
      currentRevision: number;
    }
  | { ok: false; error?: string };

export type OtRequestCatchupFn = (sinceRevision: number) => Promise<OtCatchupResult>;

export type OtListener = (state: OtClientState) => void;
export type OtContentDeltaListener = (delta: Delta) => void;
export type OtContentSetListener = (content: Delta) => void;
export type OtResyncListener = (info: { droppedPending: boolean }) => void;

export interface PersistedPending {
  revision: number;
  inFlight: DocumentContentJson['ops'];
  buffered: DocumentContentJson['ops'];
}

export interface OtRecoveryResult {
  recovered: boolean;
  droppedStale: boolean;
}

export interface OtClientOptions {
  send: OtSendFn;
  requestCatchup: OtRequestCatchupFn;
  documentId: number;
  userId: number;
}