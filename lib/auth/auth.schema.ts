import { z } from 'zod';

import { MAX_DISPLAY_NAME_LENGTH, MAX_EMAIL_LENGTH, PASSWORD_RULE_RE } from './auth.constants';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email').max(MAX_EMAIL_LENGTH),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email').max(MAX_EMAIL_LENGTH),
    password: z
      .string()
      .min(1, 'Password is required')
      .regex(
        PASSWORD_RULE_RE,
        'Password must be 8-25 characters and include at least one lowercase letter, one uppercase letter, and one digit.',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(MAX_DISPLAY_NAME_LENGTH, `Display name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`),
    invitationToken: z
      .string()
      .regex(/^[a-f0-9]{64}$/, 'Invalid invitation token')
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;