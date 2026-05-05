import { useAuthStore } from '@/lib/auth';
import { API_URL } from '@/lib/shared';

import { ApiError, ApiErrorBody } from './errors';

const API_PREFIX = '/api/v1';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

interface DataResponse<T> {
  data: T;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    return false;
  }

  refreshPromise = (async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clear();
        return false;
      }

      const payload = (await response.json()) as DataResponse<{
        accessToken: string;
        refreshToken: string;
      }>;

      setTokens({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      });
      return true;
    } catch {
      clear();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipRefresh = false, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type') && init.body) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      finalHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
    ...init,
    headers: finalHeaders,
  });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const bodyText = await response.text();
  const body = bodyText ? (JSON.parse(bodyText) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(
      (body as ApiErrorBody) ?? {
        statusCode: response.status,
        error: response.statusText,
        message: 'Request failed',
      },
    );
  }

  return (body as DataResponse<T>).data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'DELETE' }),
};