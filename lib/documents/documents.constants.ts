import { DocumentRole } from './documents.types';

export const DOCUMENT_TITLE_MAX_LENGTH = 200;
export const DOCUMENT_INVITE_MIN = 1;
export const DOCUMENT_INVITE_MAX = 50;

export const DOCUMENT_ROLE_LABELS: Record<DocumentRole, string> = {
  [DocumentRole.OWNER]: 'Owner',
  [DocumentRole.EDITOR]: 'Editor',
  [DocumentRole.VIEWER]: 'Viewer',
};