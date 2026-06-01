import { create } from 'zustand';

import { isApiError } from '@/lib/api/errors';
import type { Paginated } from '@/lib/shared';

import { OrderDirection } from '@/lib/shared';

import { documentsApi } from './documents.api';
import { DocumentFilter, DocumentOrderBy } from './documents.types';
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
  setFilter: (filter: DocumentFilter) => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  setOrder: (orderBy: DocumentOrderBy, orderDirection: OrderDirection) => Promise<void>;
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
const initialQuery: GetDocumentsQuery = {
  limit: PAGE_SIZE,
  offset: 0,
  filter: DocumentFilter.ALL,
  search: undefined,
  orderBy: DocumentOrderBy.UPDATED_AT,
  orderDirection: OrderDirection.DESC,
};

export const useDocumentsStore = create<DocumentsState>()((set, get) => ({
  list: null,
  counters: null,
  query: initialQuery,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  setQuery: (query) => set({ query }),

  setFilter: async (filter) => {
    if (get().query.filter === filter) return;
    set({ query: { ...get().query, filter, offset: 0 } });
    await get().fetchList();
  },

  setSearch: async (search) => {
    const next = search.trim() || undefined;
    if (get().query.search === next) return;
    set({ query: { ...get().query, search: next, offset: 0 } });
    await get().fetchList();
  },

  setOrder: async (orderBy, orderDirection) => {
    const { query } = get();
    if (query.orderBy === orderBy && query.orderDirection === orderDirection) return;
    set({ query: { ...query, orderBy, orderDirection, offset: 0 } });
    await get().fetchList();
  },

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
      const current = get().list;
      if (!current || current !== list) {
        set({ isLoadingMore: false });
        return;
      }

      const seen = new Set(current.items.map((item) => item.id));
      const items = [...current.items];
      next.items.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      });

      set({ list: { items, pagination: next.pagination }, isLoadingMore: false });
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

    const loaded = list?.items.length ?? PAGE_SIZE;
    try {
      const refreshed = await documentsApi.list({
        ...get().query,
        limit: Math.max(loaded, PAGE_SIZE),
        offset: 0,
      });
      set({ list: refreshed });
    } catch {
      void get().refresh();
    }
    void get().fetchCounters();
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