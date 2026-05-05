import { apiClient } from '@/lib/api/client';
import type { Paginated, PaginationQuery } from '@/lib/shared';

import type {
  AddMembersInput,
  CreateDocumentInput,
  TransferOwnerInput,
  UpdateDocumentInput,
} from './documents.schema';
import type {
  Document,
  DocumentCounters,
  DocumentMember,
  DocumentSummary,
  GetDocumentsQuery,
  GetMembersQuery,
} from './documents.types';

function buildPaginationQuery(query: PaginationQuery): string {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
}

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

  addMembers: (id: number, input: AddMembersInput): Promise<DocumentMember[]> =>
    apiClient.post<DocumentMember[]>(`/documents/${id}/members`, input),

  removeMember: (id: number, userId: number): Promise<void> =>
    apiClient.delete<void>(`/documents/${id}/members/${userId}`),

  transferOwner: (id: number, input: TransferOwnerInput): Promise<Document> =>
    apiClient.post<Document>(`/documents/${id}/transfer-owner`, input),
};