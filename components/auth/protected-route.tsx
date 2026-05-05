'use client';

import {useRouter} from 'next/navigation';
import * as React from 'react';

import {useAuthStore} from '@/lib/auth';
import {APP_ROUTES} from '@/lib/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element | null {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  React.useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace(APP_ROUTES.LOGIN);
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return null;
  }

  return <>{children}</>;
}