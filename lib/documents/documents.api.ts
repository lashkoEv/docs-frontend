import { apiClient } from '@/lib/api/client';
import { buildPaginationQuery, type Paginated } from '@/lib/shared';

import type {
  CreateDocumentInput,
  TransferOwnerInput,
  UpdateDocumentInput,
  UpdateMemberRoleInput,
} from './documents.schema';
import {
  type Document,
  type DocumentCounters,
  DocumentFilter,
  type DocumentMember,
  type DocumentSummary,
  type DocumentVersion,
  type DocumentVersionContent,
  type GetDocumentsQuery,
  type GetMembersQuery,
} from './documents.types';

export const documentsApi = {
  list: (query: GetDocumentsQuery = {}): Promise<Paginated<DocumentSummary>> => {
    const params = new URLSearchParams();
    if (query.limit !== undefined) {
      params.set('limit', String(query.limit));
    }
    if (query.offset !== undefined) {
      params.set('offset', String(query.offset));
    }
    if (query.filter && query.filter !== DocumentFilter.ALL) {
      params.set('filter', query.filter);
    }
    if (query.search) {
      params.set('search', query.search);
    }
    if (query.orderBy) {
      params.set('orderBy', query.orderBy);
    }
    if (query.orderDirection) {
      params.set('orderDirection', query.orderDirection);
    }
    const queryString = params.toString();
    return apiClient.get<Paginated<DocumentSummary>>(
      `/documents${queryString ? `?${queryString}` : ''}`,
    );
  },

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

  listVersions: (id: number): Promise<DocumentVersion[]> =>
    apiClient.get<DocumentVersion[]>(`/documents/${id}/versions`),

  getVersion: (id: number, revision: number): Promise<DocumentVersionContent> =>
    apiClient.get<DocumentVersionContent>(`/documents/${id}/versions/${revision}`),

  restoreVersion: (id: number, revision: number): Promise<Document> =>
    apiClient.post<Document>(`/documents/${id}/versions/${revision}/restore`),
};