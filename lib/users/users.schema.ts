import { z } from 'zod';

import { MAX_DISPLAY_NAME_LENGTH, PASSWORD_RULE_RE } from '@/lib/auth/auth.constants';

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(MAX_DISPLAY_NAME_LENGTH, `Display name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .regex(
        PASSWORD_RULE_RE,
        'Password must be 8-25 characters and include at least one lowercase letter, one uppercase letter, and one digit.',
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;