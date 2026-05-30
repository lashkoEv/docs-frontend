import { create } from 'zustand';

import { isApiError } from '@/lib/api/errors';
import type { Paginated } from '@/lib/shared';

import { documentsApi } from './documents.api';
import type {
  DocumentCounters,
  DocumentRole,
  DocumentSummary,
  GetDocumentsQuery,
} from './documents.types';

interface DocumentsState {
  list: Paginated<DocumentSummary> | null;
  counters: DocumentCounters | null;
  query: GetDocumentsQuery;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  setQuery: (query: GetDocumentsQuery) => void;
  fetchList: () => Promise<void>;
  loadMore: () => Promise<void>;
  fetchCounters: () => Promise<void>;
  applyAccessChange: (change: {
    documentId: number;
    role: DocumentRole | null;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 10;
const initialQuery: GetDocumentsQuery = { limit: PAGE_SIZE, offset: 0 };

export const useDocumentsStore = create<DocumentsState>()((set, get) => ({
  list: null,
  counters: null,
  query: initialQuery,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  setQuery: (query) => set({ query }),

  fetchList: async () => {
    set({ isLoading: true, error: null, query: { ...get().query, offset: 0 } });
    try {
      const list = await documentsApi.list({ ...get().query, offset: 0 });
      set({ list, isLoading: false });
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Failed to load documents';
      set({ isLoading: false, error: message });
    }
  },

  loadMore: async () => {
    const { list, query, isLoadingMore, isLoading } = get();
    if (!list || isLoading || isLoadingMore) return;
    if (list.items.length >= list.pagination.total) return;

    const limit = query.limit ?? PAGE_SIZE;
    const offset = list.items.length;

    set({ isLoadingMore: true });
    try {
      const next = await documentsApi.list({ ...query, limit, offset });
      set({
        list: {
          items: [...list.items, ...next.items],
          pagination: next.pagination,
        },
        isLoadingMore: false,
      });
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Failed to load more';
      set({ isLoadingMore: false, error: message });
    }
  },

  fetchCounters: async () => {
    try {
      const counters = await documentsApi.getCounters();
      set({ counters });
    } catch {
      // counters failure is non-fatal — list page still renders
    }
  },

  applyAccessChange: async ({ documentId, role }) => {
    const { list } = get();

    if (role === null) {
      if (list?.items.some((item) => item.id === documentId)) {
        set({
          list: {
            items: list.items.filter((item) => item.id !== documentId),
            pagination: {
              ...list.pagination,
              total: Math.max(0, list.pagination.total - 1),
            },
          },
        });
      }
      void get().fetchCounters();
      return;
    }

    if (list?.items.some((item) => item.id === documentId)) {
      set({
        list: {
          ...list,
          items: list.items.map((item) =>
            item.id === documentId ? { ...item, myRole: role } : item,
          ),
        },
      });
      return;
    }

    try {
      const document = await documentsApi.getById(documentId);
      const summary: DocumentSummary = {
        id: document.id,
        title: document.title,
        revision: document.revision,
        ownerId: document.ownerId,
        myRole: document.myRole,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      };
      const current = get().list;
      if (current && !current.items.some((item) => item.id === documentId)) {
        set({
          list: {
            items: [summary, ...current.items],
            pagination: {
              ...current.pagination,
              total: current.pagination.total + 1,
            },
          },
        });
      }
      void get().fetchCounters();
    } catch {
      void get().refresh();
    }
  },

  refresh: async () => {
    await Promise.all([get().fetchList(), get().fetchCounters()]);
  },

  reset: () =>
    set({
      list: null,
      counters: null,
      query: initialQuery,
      error: null,
      isLoading: false,
      isLoadingMore: false,
    }),
}));