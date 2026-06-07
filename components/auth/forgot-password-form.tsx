'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { useForm } from 'react-hook-form';

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
import { toastApiError } from '@/lib/api/errors';
import { authApi, ForgotPasswordInput, forgotPasswordSchema } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/shared';

export function ForgotPasswordForm(): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordInput): Promise<void> => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(values.email);
      setSentTo(values.email);
    } catch (error) {
      toastApiError(error, 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-5">
        <div className="border-border flex items-start gap-3 rounded-lg border p-4">
          <MailCheck className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            If an account exists for <span className="text-foreground font-medium">{sentTo}</span>,
            we&apos;ve sent a link to reset the password. Check your inbox.
          </p>
        </div>
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href={APP_ROUTES.LOGIN}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

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

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Remembered it?{' '}
          <Link
            href={APP_ROUTES.LOGIN}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}