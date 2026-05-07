'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { isApiError } from '@/lib/api/errors';
import { authApi, LoginInput, loginSchema, useAuthStore } from '@/lib/auth';
import { invitationsApi } from '@/lib/invitations';
import { APP_ROUTES } from '@/lib/shared';

interface LoginFormProps {
  invitationToken?: string;
  prefilledEmail?: string;
}

export function LoginForm({
  invitationToken,
  prefilledEmail,
}: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: prefilledEmail ?? '', password: '' },
  });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setIsSubmitting(true);
    try {
      const { session, user } = await authApi.login(values);
      setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user,
      });
      toast.success(`Welcome back, ${user.displayName}`);

      if (invitationToken) {
        try {
          const accepted = await invitationsApi.accept(invitationToken);
          router.replace(`${APP_ROUTES.DOCUMENTS}/${accepted.documentId}`);
          return;
        } catch (acceptError) {
          if (isApiError(acceptError)) {
            toast.error(acceptError.message);
          }
          router.replace(`/invite/${invitationToken}`);
          return;
        }
      }

      router.replace(APP_ROUTES.DOCUMENTS);
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to log in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jane.doe@example.com"
                  autoComplete="email"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href={
              invitationToken
                ? `${APP_ROUTES.REGISTER}?${new URLSearchParams({
                    invitationToken,
                    ...(prefilledEmail ? { email: prefilledEmail } : {}),
                  }).toString()}`
                : APP_ROUTES.REGISTER
            }
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </Form>
  );
}