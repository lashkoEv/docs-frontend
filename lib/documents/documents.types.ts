import { type OrderDirection, type PaginationQuery } from '@/lib/shared';
import type { User } from '@/lib/users';

export enum DocumentRole {
  OWNER = 1,
  EDITOR = 2,
  VIEWER = 3,
}

export type AssignableDocumentRole = DocumentRole.EDITOR | DocumentRole.VIEWER;

export interface DocumentContentJson {
  ops: Array<Record<string, unknown>>;
}

export interface DocumentSummary {
  id: number;
  title: string;
  revision: number;
  ownerId: number;
  myRole: DocumentRole;
  createdAt: string;
  updatedAt: string;
}

export interface Document extends DocumentSummary {
  content: DocumentContentJson;
}

export interface DocumentMember {
  user: User;
  role: DocumentRole;
  createdAt: string;
}

export interface DocumentCounters {
  owned: number;
  sharedWithMe: number;
  total: number;
}

export interface DocumentVersion {
  revision: number;
  author: User | null;
  createdAt: string;
}

export interface DocumentVersionContent extends DocumentVersion {
  content: DocumentContentJson;
}

export enum DocumentFilter {
  ALL = 'all',
  OWNED = 'owned',
  SHARED = 'shared',
}

export enum DocumentOrderBy {
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  TITLE = 'title',
}

export type GetDocumentsQuery = PaginationQuery & {
  filter?: DocumentFilter;
  search?: string;
  orderBy?: DocumentOrderBy;
  orderDirection?: OrderDirection;
};
export type GetMembersQuery = PaginationQuery;