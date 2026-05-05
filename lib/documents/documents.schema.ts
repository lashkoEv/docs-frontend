import { z } from 'zod';

import {
  DOCUMENT_INVITE_MAX,
  DOCUMENT_INVITE_MIN,
  DOCUMENT_TITLE_MAX_LENGTH,
} from './documents.constants';
import { DocumentRole } from './documents.types';

const titleField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, 'Title is required')
      .max(
        DOCUMENT_TITLE_MAX_LENGTH,
        `Title must be at most ${DOCUMENT_TITLE_MAX_LENGTH} characters`,
      ),
  );

export const createDocumentSchema = z.object({
  title: titleField,
});

export const updateDocumentSchema = z.object({
  title: titleField.optional(),
});

export const memberInviteSchema = z.object({
  userId: z.number().int().positive(),
  role: z.union([
    z.literal(DocumentRole.EDITOR),
    z.literal(DocumentRole.VIEWER),
  ]),
});

export const addMembersSchema = z.object({
  invites: z.array(memberInviteSchema).min(DOCUMENT_INVITE_MIN).max(DOCUMENT_INVITE_MAX),
});

export const transferOwnerSchema = z.object({
  userId: z.number().int().positive(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
export type TransferOwnerInput = z.infer<typeof transferOwnerSchema>;