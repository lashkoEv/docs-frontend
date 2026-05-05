import Link from 'next/link';
import * as React from 'react';

import { StatusPageShell } from '@/components/layout/status-page-shell';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/shared';

export default function NotFound(): React.JSX.Element {
  return (
    <StatusPageShell>
      <p className="text-muted-foreground text-sm font-semibold tracking-[0.2em] uppercase">
        404
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
        We couldn&apos;t find that page.
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-sm text-base leading-relaxed text-pretty">
        The link might be broken, or the document may have been moved or deleted.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href={APP_ROUTES.HOME}>Back to home</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={APP_ROUTES.DOCUMENTS}>Open documents</Link>
        </Button>
      </div>
    </StatusPageShell>
  );
}