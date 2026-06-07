import type { PersistedPending } from './realtime.types';

const storageKey = (documentId: number, userId: number): string =>
  `doc-pending-${documentId}-${userId}`;

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
    window.localStorage.setItem(storageKey(documentId, userId), JSON.stringify(data));
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