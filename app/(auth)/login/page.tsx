import * as React from 'react';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your workspace and pick up where you left off.
        </p>
      </div>

      <LoginForm />
    </div>
  );
}