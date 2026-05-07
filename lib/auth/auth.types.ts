export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSession {
  session: SessionTokens;
  user: AuthUser;
  redirectDocumentId?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  invitationToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (params: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (params: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}