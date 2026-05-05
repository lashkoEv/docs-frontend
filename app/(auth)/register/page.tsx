import * as React from 'react';

import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
        <p className="text-muted-foreground text-sm">
          Create your free account and start collaborating in minutes.
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}