import type { PaginationQuery } from './types';

export const appendPaginationParams = (
  params: URLSearchParams,
  query: PaginationQuery,
): void => {
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.offset !== undefined) {
    params.set('offset', String(query.offset));
  }
};

export const buildPaginationQuery = (query: PaginationQuery): string => {
  const params = new URLSearchParams();
  appendPaginationParams(params, query);
  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
};