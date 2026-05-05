import type { PaginationQuery } from '@/lib/shared';

export interface User {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersQuery extends PaginationQuery {
  search?: string;
  excludeIds?: number[];
}