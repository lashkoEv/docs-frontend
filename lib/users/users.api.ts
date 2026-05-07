import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/lib/shared';

import { GetUsersQuery, User } from './users.types';

const buildQuery = (query: GetUsersQuery): string => {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.excludeIds && query.excludeIds.length > 0) {
    params.set('excludeIds', query.excludeIds.join(','));
  }
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
};

export const usersApi = {
  findAll: (query: GetUsersQuery = {}): Promise<Paginated<User>> =>
    apiClient.get<Paginated<User>>(`/users${buildQuery(query)}`),
};