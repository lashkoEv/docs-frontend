'use client';

import * as React from 'react';

import { useDocumentsStore } from '@/lib/documents';
import { realtimeClient } from '@/lib/realtime';

export function RealtimeListSync(): null {
  const applyAccessChange = useDocumentsStore((state) => state.applyAccessChange);

  React.useEffect(() => {
    realtimeClient.connect();
    const unsubscribe = realtimeClient.onDocumentListChanged((event) => {
      void applyAccessChange(event);
    });

    return () => {
      unsubscribe();
      realtimeClient.disconnect();
    };
  }, [applyAccessChange]);

  return null;
}