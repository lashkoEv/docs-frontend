import { apiClient } from '@/lib/api/client';

import { LoginPayload, RegisterPayload, AuthUser, UserSession } from './auth.types';

export const authApi = {
  register: (payload: RegisterPayload): Promise<UserSession> =>
    apiClient.post<UserSession>('/auth/register', payload, { skipAuth: true }),

  login: (payload: LoginPayload): Promise<UserSession> =>
    apiClient.post<UserSession>('/auth/login', payload, { skipAuth: true }),

  logout: (): Promise<void> => apiClient.delete<void>('/auth/logout'),

  me: (): Promise<AuthUser> => apiClient.get<AuthUser>('/users/me'),
};