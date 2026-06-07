import { PENDING_STORAGE_PREFIX, PENDING_TTL_MS } from './realtime.constants';
import type { PersistedPending } from './realtime.types';

const TAB_ID_KEY = 'docs-tab-id';

const tabId = (): string => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return 'server';
  }
  let id = window.sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
};

const storageKey = (documentId: number, userId: number): string =>
  `${PENDING_STORAGE_PREFIX}${documentId}-${userId}-${tabId()}`;

const isAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadPending = (
  documentId: number,
  userId: number,
): PersistedPending | null => {
  if (!isAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(documentId, userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedPending;
    if (
      typeof parsed.revision !== 'number' ||
      !Array.isArray(parsed.inFlight) ||
      !Array.isArray(parsed.buffered)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const savePending = (
  documentId: number,
  userId: number,
  data: PersistedPending,
): void => {
  if (!isAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(
      storageKey(documentId, userId),
      JSON.stringify({ ...data, savedAt: Date.now() }),
    );
  } catch {}
};

export const clearPending = (documentId: number, userId: number): void => {
  if (!isAvailable()) {
    return;
  }
  try {
    window.localStorage.removeItem(storageKey(documentId, userId));
  } catch {}
};

export const prunePending = (): void => {
  if (!isAvailable()) {
    return;
  }
  try {
    const now = Date.now();
    const stale: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(PENDING_STORAGE_PREFIX)) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      const savedAt = raw ? (JSON.parse(raw) as { savedAt?: unknown }).savedAt : undefined;
      if (typeof savedAt !== 'number' || now - savedAt > PENDING_TTL_MS) {
        stale.push(key);
      }
    }
    stale.forEach((key) => window.localStorage.removeItem(key));
  } catch {}
};