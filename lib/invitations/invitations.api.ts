import { apiClient } from '@/lib/api/client';
import { buildPaginationQuery, type Paginated } from '@/lib/shared';

import type {
  AcceptInvitationResponse,
  BulkInvitePayload,
  BulkInviteResponse,
  Invitation,
  ListInvitationsQuery,
} from './invitations.types';

export const invitationsApi = {
  inviteBulk: (
    documentId: number,
    payload: BulkInvitePayload,
  ): Promise<BulkInviteResponse> =>
    apiClient.post<BulkInviteResponse>(
      `/documents/${documentId}/invitations/bulk`,
      payload,
    ),

  listPending: (
    documentId: number,
    query: ListInvitationsQuery = {},
  ): Promise<Paginated<Invitation>> =>
    apiClient.get<Paginated<Invitation>>(
      `/documents/${documentId}/invitations${buildPaginationQuery(query)}`,
    ),

  revoke: (documentId: number, invitationId: number): Promise<void> =>
    apiClient.delete<void>(`/documents/${documentId}/invitations/${invitationId}`),

  accept: (token: string): Promise<AcceptInvitationResponse> =>
    apiClient.post<AcceptInvitationResponse>(`/invitations/${token}/accept`),
};