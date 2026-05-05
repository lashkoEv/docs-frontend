import * as React from 'react';

import { LogoLink } from '@/components/brand/logo-link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface StatusPageShellProps {
  children: React.ReactNode;
}

export function StatusPageShell({ children }: StatusPageShellProps): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <LogoLink />
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16 sm:px-10">
        <div
          aria-hidden="true"
          className="from-brand-from/20 via-brand-via/15 pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br to-transparent blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-md text-center">{children}</div>
      </main>

      <footer className="text-muted-foreground border-border mt-auto border-t px-6 py-6 text-xs sm:px-10">
        <div className="mx-auto max-w-5xl">
          © {new Date().getFullYear()} Docs Lite — Yevheniia Lashko
        </div>
      </footer>
    </div>
  );
}