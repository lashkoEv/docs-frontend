import type { FileInfo } from '@/lib/files';
import type { PaginationQuery } from '@/lib/shared';

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatar: FileInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersQuery extends PaginationQuery {
  search?: string;
  excludeIds?: number[];
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatarId?: number | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}