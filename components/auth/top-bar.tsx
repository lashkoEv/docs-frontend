'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { LogoLink } from '@/components/brand/logo-link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isApiError } from '@/lib/api/errors';
import { authApi, useAuthStore } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/shared';

export function TopBar(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      }
    } finally {
      clear();
      router.replace(APP_ROUTES.LOGIN);
    }
  };

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
      <LogoLink />

      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {user.displayName}
          </span>
        ) : null}
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    </header>
  );
}