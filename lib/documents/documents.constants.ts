import type { AssignableDocumentRole } from './documents.types';
import { DocumentRole } from './documents.types';

export const DOCUMENT_TITLE_MAX_LENGTH = 200;

export const DOCUMENT_ROLE_LABELS: Record<DocumentRole, string> = {
  [DocumentRole.OWNER]: 'Owner',
  [DocumentRole.EDITOR]: 'Editor',
  [DocumentRole.VIEWER]: 'Viewer',
};

export const ASSIGNABLE_DOCUMENT_ROLES: AssignableDocumentRole[] = [
  DocumentRole.EDITOR,
  DocumentRole.VIEWER,
];