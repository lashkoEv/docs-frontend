import * as React from 'react';

import { LoginForm } from '@/components/auth/login-form';

interface LoginPageProps {
  searchParams: Promise<{ invitationToken?: string; email?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const { invitationToken, email } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          {invitationToken
            ? 'Sign in to accept the invitation.'
            : 'Sign in to your workspace and pick up where you left off.'}
        </p>
      </div>

      <LoginForm invitationToken={invitationToken} prefilledEmail={email} />
    </div>
  );
}