'use client';

import * as React from 'react';

import { realtimeClient } from './realtime.client';
import { useRealtimeStore } from './realtime.store';
import type {
  ConnectionStatus,
  DocumentRoleChangedEvent,
  DocumentSnapshot,
} from './realtime.types';
import type { DocumentRole } from '@/lib/documents';

interface UseDocumentRoomResult {
  status: ConnectionStatus;
  errorMessage: string | null;
  myRole: DocumentRole | null;
  snapshot: DocumentSnapshot | null;
  isJoining: boolean;
  joinError: string | null;
}

export function useDocumentRoom(documentId: number | null): UseDocumentRoomResult {
  const status = useRealtimeStore((state) => state.status);
  const errorMessage = useRealtimeStore((state) => state.errorMessage);
  const myRole = useRealtimeStore((state) => state.myRole);

  const [snapshot, setSnapshot] = React.useState<DocumentSnapshot | null>(null);
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  React.useEffect(() => {
    realtimeClient.acquire();
    return () => {
      realtimeClient.release();
    };
  }, []);

  React.useEffect(() => {
    if (documentId === null) {
      return;
    }

    let cancelled = false;
    setIsJoining(true);
    setJoinError(null);
    setSnapshot(null);

    const join = async (): Promise<void> => {
      const ack = await realtimeClient.joinDocument(documentId);
      if (cancelled) {
        return;
      }
      if (ack.ok) {
        setSnapshot({ revision: ack.revision, content: ack.content });
        setJoinError(null);
      } else {
        setSnapshot(null);
        setJoinError(ack.error);
      }
      setIsJoining(false);
    };

    void join();

    return () => {
      cancelled = true;
      setSnapshot(null);
      void realtimeClient.leaveDocument(documentId);
    };
  }, [documentId]);

  React.useEffect(() => {
    if (documentId === null) {
      return;
    }

    const unsubscribeRole = realtimeClient.onRoleChanged(
      (event: DocumentRoleChangedEvent) => {
        if (event.documentId !== documentId) {
          return;
        }
        if (event.role === null) {
          setSnapshot(null);
          setJoinError('Your access to this document was revoked');
        }
      },
    );

    const unsubscribeDeleted = realtimeClient.onDocumentDeleted((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      setSnapshot(null);
      setJoinError('This document was deleted');
    });

    return () => {
      unsubscribeRole();
      unsubscribeDeleted();
    };
  }, [documentId]);

  return { status, errorMessage, myRole, snapshot, isJoining, joinError };
}