import { apiClient } from '@/lib/api/client';

import { LoginPayload, RegisterPayload, ResetPasswordPayload, AuthUser, UserSession } from './auth.types';

export const authApi = {
  register: (payload: RegisterPayload): Promise<UserSession> =>
    apiClient.post<UserSession>('/auth/register', payload, { skipAuth: true }),

  login: (payload: LoginPayload): Promise<UserSession> =>
    apiClient.post<UserSession>('/auth/login', payload, { skipAuth: true }),

  logout: (): Promise<void> => apiClient.delete<void>('/auth/logout'),

  me: (): Promise<AuthUser> => apiClient.get<AuthUser>('/users/me'),

  forgotPassword: (email: string): Promise<void> =>
    apiClient.post<void>('/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (payload: ResetPasswordPayload): Promise<void> =>
    apiClient.post<void>('/auth/reset-password', payload, { skipAuth: true }),
};