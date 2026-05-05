'use client';

import { FilePlus2 } from 'lucide-react';
import * as React from 'react';

import { CreateDocumentDialog } from '@/components/documents/create-document-dialog';
import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { DocumentsCounters } from '@/components/documents/documents-counters';
import { DocumentsList } from '@/components/documents/documents-list';
import { Button } from '@/components/ui/button';
import { type DocumentSummary, useDocumentsStore } from '@/lib/documents';

export default function DocumentsPage(): React.JSX.Element {
  const counters = useDocumentsStore((state) => state.counters);
  const refresh = useDocumentsStore((state) => state.refresh);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [docToDelete, setDocToDelete] = React.useState<DocumentSummary | null>(null);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">
            All the documents you own or have access to live here.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <FilePlus2 className="size-4" />
          New document
        </Button>
      </header>

      <DocumentsCounters counters={counters} />

      <DocumentsList
        onRequestDelete={(document) => setDocToDelete(document)}
        onRequestNew={() => setCreateOpen(true)}
      />

      <CreateDocumentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteDocumentDialog
        document={docToDelete}
        onOpenChange={(open) => {
          if (!open) setDocToDelete(null);
        }}
        onDeleted={() => {
          setDocToDelete(null);
          void refresh();
        }}
      />
    </main>
  );
}