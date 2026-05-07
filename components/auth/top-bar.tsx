'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { LogoLink } from '@/components/brand/logo-link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isApiError } from '@/lib/api/errors';
import { authApi, useAuthStore } from '@/lib/auth';
import { APP_ROUTES, getInitials } from '@/lib/shared';

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

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted/40 h-10 gap-2 px-2"
                disabled={isLoggingOut}
              >
                <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {getInitials(user.displayName)}
                </span>
                <span className="text-foreground hidden text-sm font-medium sm:inline">
                  {user.displayName}
                </span>
                <ChevronDown className="text-muted-foreground size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-foreground text-sm font-medium">
                  {user.displayName}
                </span>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="size-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
