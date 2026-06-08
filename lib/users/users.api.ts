import { apiClient } from '@/lib/api/client';
import { appendPaginationParams, type Paginated } from '@/lib/shared';

import { ChangePasswordPayload, GetUsersQuery, UpdateProfilePayload, User } from './users.types';

const buildQuery = (query: GetUsersQuery): string => {
  const params = new URLSearchParams();
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.excludeIds && query.excludeIds.length > 0) {
    params.set('excludeIds', query.excludeIds.join(','));
  }
  appendPaginationParams(params, query);
  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
};

export const usersApi = {
  findAll: (query: GetUsersQuery = {}): Promise<Paginated<User>> =>
    apiClient.get<Paginated<User>>(`/users${buildQuery(query)}`),

  updateProfile: (payload: UpdateProfilePayload): Promise<User> =>
    apiClient.patch<User>('/users/me', payload),

  changePassword: (payload: ChangePasswordPayload): Promise<void> =>
    apiClient.patch<void>('/users/me/password', payload),
};