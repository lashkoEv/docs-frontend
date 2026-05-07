import { create } from 'zustand';

import type { RealtimeState } from './realtime.types';

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: 'idle',
  errorMessage: null,
  joinedDocumentId: null,
  myRole: null,

  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),

  setJoined: (documentId, myRole) =>
    set({ joinedDocumentId: documentId, myRole, status: 'connected' }),

  clearJoined: () => set({ joinedDocumentId: null, myRole: null }),

  reset: () =>
    set({
      status: 'idle',
      errorMessage: null,
      joinedDocumentId: null,
      myRole: null,
    }),
}));