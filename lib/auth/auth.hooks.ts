'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useAuthStore } from './auth.store';

export const useAuthHydrated = (): boolean => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
};

type AuthGateMode = 'protected' | 'guest';

export const useAuthGate = (mode: AuthGateMode, redirectTo: string): boolean => {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthHydrated();
  const shouldRedirect = mode === 'protected' ? !accessToken : Boolean(accessToken);

  React.useEffect(() => {
    if (hydrated && shouldRedirect) {
      router.replace(redirectTo);
    }
  }, [hydrated, shouldRedirect, redirectTo, router]);

  return hydrated && !shouldRedirect;
};