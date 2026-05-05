import type { PaginationQuery } from '@/lib/shared';
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

export interface MemberInvite {
  userId: number;
  role: AssignableDocumentRole;
}

export type GetDocumentsQuery = PaginationQuery;
export type GetMembersQuery = PaginationQuery;