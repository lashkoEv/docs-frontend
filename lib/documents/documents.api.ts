import { apiClient } from '@/lib/api/client';
import { buildPaginationQuery, type Paginated } from '@/lib/shared';

import type {
  CreateDocumentInput,
  TransferOwnerInput,
  UpdateDocumentInput,
  UpdateMemberRoleInput,
} from './documents.schema';
import type {
  Document,
  DocumentCounters,
  DocumentMember,
  DocumentSummary,
  GetDocumentsQuery,
  GetMembersQuery,
} from './documents.types';

export const documentsApi = {
  list: (query: GetDocumentsQuery = {}): Promise<Paginated<DocumentSummary>> =>
    apiClient.get<Paginated<DocumentSummary>>(`/documents${buildPaginationQuery(query)}`),

  getCounters: (): Promise<DocumentCounters> =>
    apiClient.get<DocumentCounters>('/documents/counters'),

  getById: (id: number): Promise<Document> =>
    apiClient.get<Document>(`/documents/${id}`),

  create: (input: CreateDocumentInput): Promise<Document> =>
    apiClient.post<Document>('/documents', input),

  update: (id: number, input: UpdateDocumentInput): Promise<Document> =>
    apiClient.patch<Document>(`/documents/${id}`, input),

  remove: (id: number): Promise<void> =>
    apiClient.delete<void>(`/documents/${id}`),

  listMembers: (
    id: number,
    query: GetMembersQuery = {},
  ): Promise<Paginated<DocumentMember>> =>
    apiClient.get<Paginated<DocumentMember>>(
      `/documents/${id}/members${buildPaginationQuery(query)}`,
    ),

  updateMemberRole: (
    id: number,
    userId: number,
    input: UpdateMemberRoleInput,
  ): Promise<DocumentMember> =>
    apiClient.patch<DocumentMember>(`/documents/${id}/members/${userId}`, input),

  removeMember: (id: number, userId: number): Promise<void> =>
    apiClient.delete<void>(`/documents/${id}/members/${userId}`),

  transferOwner: (id: number, input: TransferOwnerInput): Promise<Document> =>
    apiClient.post<Document>(`/documents/${id}/transfer-owner`, input),
};