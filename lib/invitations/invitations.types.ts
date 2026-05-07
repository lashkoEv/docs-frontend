import type { AssignableDocumentRole, DocumentRole } from '@/lib/documents';
import type { PaginationQuery } from '@/lib/shared';
import type { User } from '@/lib/users';

export interface InvitationPreview {
  email: string;
  role: DocumentRole;
  documentTitle: string;
  inviterDisplayName: string;
  expiresAt: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: DocumentRole;
  expiresAt: string;
  invitedBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptInvitationResponse {
  documentId: number;
}

export interface BulkInvitePayload {
  emails: string[];
  role: AssignableDocumentRole;
}

export interface BulkInviteGrantedItem {
  email: string;
  userId: number;
  role: DocumentRole;
}

export interface BulkInviteInvitedItem {
  email: string;
  invitationId: number;
  role: DocumentRole;
  expiresAt: string;
}

export interface BulkInviteErrorItem {
  email: string;
  message: string;
}

export interface BulkInviteResponse {
  granted: BulkInviteGrantedItem[];
  invited: BulkInviteInvitedItem[];
  errors: BulkInviteErrorItem[];
}

export interface InviteChipItem {
  email: string;
  userId?: number;
  displayName?: string;
}

export type ListInvitationsQuery = PaginationQuery;