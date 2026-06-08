export const S3_PUBLIC_URL =
  process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? 'http://localhost:9000/docs-lite-avatars';

export const MAX_AVATAR_SIZE_MB = 5;

export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

export const MAX_AVATAR_SIZE_LABEL = `${MAX_AVATAR_SIZE_MB} MB`;

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const AVATAR_FILE_INPUT_ACCEPT = ALLOWED_AVATAR_MIME_TYPES.join(',');