'use client';

import * as React from 'react';

import { realtimeClient } from './realtime.client';
import { useRealtimeStore } from './realtime.store';
import type { ConnectionStatus } from './realtime.types';
import type { DocumentRole } from '@/lib/documents';

interface UseDocumentRoomResult {
  status: ConnectionStatus;
  errorMessage: string | null;
  myRole: DocumentRole | null;
}

export function useDocumentRoom(documentId: number | null): UseDocumentRoomResult {
  const status = useRealtimeStore((state) => state.status);
  const errorMessage = useRealtimeStore((state) => state.errorMessage);
  const myRole = useRealtimeStore((state) => state.myRole);

  React.useEffect(() => {
    if (documentId === null) return;
    void realtimeClient.joinDocument(documentId);
    return () => {
      void realtimeClient.leaveDocument(documentId);
    };
  }, [documentId]);

  return { status, errorMessage, myRole };
}