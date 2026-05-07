import Link from 'next/link';
import * as React from 'react';

import { StatusPageShell } from '@/components/layout/status-page-shell';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/shared';

interface InvitationStatusPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function InvitationStatusPage({
  eyebrow,
  title,
  description,
}: InvitationStatusPageProps): React.JSX.Element {
  return (
    <StatusPageShell>
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-sm text-base leading-relaxed text-pretty">
        {description}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href={APP_ROUTES.HOME}>Back to home</Link>
        </Button>
      </div>
    </StatusPageShell>
  );
}