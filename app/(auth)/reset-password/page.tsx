import Link from 'next/link';
import * as React from 'react';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { APP_ROUTES } from '@/lib/shared';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<React.JSX.Element> {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">This link isn&apos;t valid</h1>
          <p className="text-muted-foreground text-sm">
            The password reset link is missing or incomplete. Request a new one and try again.
          </p>
        </div>
        <p className="text-sm">
          <Link
            href={APP_ROUTES.FORGOT_PASSWORD}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground text-sm">
          Choose a new password for your account. You&apos;ll be signed out everywhere else.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}