import { create } from 'zustand';

import { isApiError } from '@/lib/api/errors';

import { documentsApi } from './documents.api';
import type { Document, DocumentMember } from './documents.types';

interface DocumentDetailState {
  document: Document | null;
  members: DocumentMember[];
  isLoading: boolean;
  isMembersLoading: boolean;
  error: string | null;

  load: (id: number) => Promise<void>;
  reloadDocument: () => Promise<void>;
  reloadMembers: () => Promise<void>;
  setDocument: (document: Document) => void;
  reset: () => void;
}

const MEMBERS_PAGE_LIMIT = 100;

export const useDocumentDetailStore = create<DocumentDetailState>()((set, get) => ({
  document: null,
  members: [],
  isLoading: false,
  isMembersLoading: false,
  error: null,

  load: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const [document, members] = await Promise.all([
        documentsApi.getById(id),
        documentsApi.listMembers(id, { limit: MEMBERS_PAGE_LIMIT, offset: 0 }),
      ]);
      set({ document, members: members.items, isLoading: false });
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Failed to load document';
      set({ isLoading: false, error: message });
    }
  },

  reloadDocument: async () => {
    const current = get().document;
    if (!current) return;
    try {
      const document = await documentsApi.getById(current.id);
      set({ document });
    } catch (error) {
      if (isApiError(error)) {
        set({ error: error.message });
      }
    }
  },

  reloadMembers: async () => {
    const current = get().document;
    if (!current) return;
    set({ isMembersLoading: true });
    try {
      const members = await documentsApi.listMembers(current.id, {
        limit: MEMBERS_PAGE_LIMIT,
        offset: 0,
      });
      set({ members: members.items, isMembersLoading: false });
    } catch {
      set({ isMembersLoading: false });
    }
  },

  setDocument: (document) => set({ document }),

  reset: () =>
    set({
      document: null,
      members: [],
      isLoading: false,
      isMembersLoading: false,
      error: null,
    }),
}));