'use client';

import * as React from 'react';

import { useDocumentsStore } from '@/lib/documents';
import { realtimeClient } from '@/lib/realtime';

export function RealtimeListSync(): null {
  const applyAccessChange = useDocumentsStore((state) => state.applyAccessChange);

  React.useEffect(() => {
    realtimeClient.acquire();
    const unsubscribe = realtimeClient.onDocumentListChanged((event) => {
      void applyAccessChange(event);
    });

    return () => {
      unsubscribe();
      realtimeClient.release();
    };
  }, [applyAccessChange]);

  return null;
}