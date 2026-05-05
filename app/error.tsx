'use client';

import Link from 'next/link';
import * as React from 'react';

import { StatusPageShell } from '@/components/layout/status-page-shell';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/shared';

interface ErrorPageProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function ErrorPage({ error, unstable_retry }: ErrorPageProps): React.JSX.Element {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPageShell>
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
        Something went wrong
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
        We hit a snag loading this.
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-sm text-base leading-relaxed text-pretty">
        An unexpected error happened. Try again, and if it keeps happening, let us know.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={unstable_retry}>
          Try again
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={APP_ROUTES.HOME}>Back to home</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="text-muted-foreground/70 mt-8 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
    </StatusPageShell>
  );
}