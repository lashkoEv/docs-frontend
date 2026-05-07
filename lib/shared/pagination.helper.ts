import type { PaginationQuery } from './types';

export const buildPaginationQuery = (query: PaginationQuery): string => {
  const params = new URLSearchParams();
  if (query.limit !== undefined) {
      params.set('limit', String(query.limit));
  }
  if (query.offset !== undefined) {
      params.set('offset', String(query.offset));
  }
  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
};