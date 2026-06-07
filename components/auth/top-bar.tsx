'use client';

import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { LogoLink } from '@/components/brand/logo-link';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
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
import { UserAvatar } from '@/components/ui/user-avatar';
import { isApiError } from '@/lib/api/errors';
import { authApi, useAuthStore } from '@/lib/auth';
import { realtimeClient } from '@/lib/realtime';
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
      realtimeClient.disconnect();
      clear();
      router.replace(APP_ROUTES.LOGIN);
    }
  };

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
      <LogoLink />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user ? <NotificationsBell /> : null}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2"
                disabled={isLoggingOut}
              >
                <UserAvatar displayName={user.displayName} avatar={user.avatar} />
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
              <DropdownMenuItem asChild>
                <Link href={APP_ROUTES.PROFILE}>
                  <UserRound className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
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
