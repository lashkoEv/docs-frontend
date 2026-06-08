'use client';

import * as React from 'react';

import { useAuthGate } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element | null {
  const ready = useAuthGate('protected', APP_ROUTES.LOGIN);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}