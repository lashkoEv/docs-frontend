import { FilePlus2, FileText } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';

export default function DocumentsPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">
            All the documents you own or have access to will live here.
          </p>
        </div>
        <Button size="sm" disabled>
          <FilePlus2 className="size-4" />
          New document
        </Button>
      </header>

      <section className="border-border bg-card flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-16 text-center">
        <span className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-xl">
          <FileText className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            No documents yet
          </h2>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
            Document creation, sharing, and the collaborative editor are coming
            soon. You&apos;ll be able to start a new doc right from here.
          </p>
        </div>
      </section>
    </main>
  );
}