'use client';

import * as React from 'react';

import { useAuthGate } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/shared';

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps): React.JSX.Element | null {
  const ready = useAuthGate('guest', APP_ROUTES.DOCUMENTS);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}