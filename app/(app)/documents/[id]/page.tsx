'use client';

import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { DocumentMembersSection } from '@/components/documents/document-members-section';
import { DocumentRoleBadge } from '@/components/documents/document-role-badge';
import { DocumentTitleEditor } from '@/components/documents/document-title-editor';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DocumentRole,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';
import { APP_ROUTES } from '@/lib/shared';

export default function DocumentDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const documentId = Number(params.id);
  const isValidId = Number.isInteger(documentId) && documentId > 0;

  const document = useDocumentDetailStore((state) => state.document);
  const isLoading = useDocumentDetailStore((state) => state.isLoading);
  const error = useDocumentDetailStore((state) => state.error);
  const load = useDocumentDetailStore((state) => state.load);
  const reset = useDocumentDetailStore((state) => state.reset);

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isValidId) {
      router.replace(APP_ROUTES.DOCUMENTS);
      return;
    }
    void load(documentId);
    return () => reset();
  }, [isValidId, documentId, load, reset, router]);

  if (!isValidId) {
    return <></>;
  }

  if (error && !document) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-10">
        <Link
          href={APP_ROUTES.DOCUMENTS}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to documents
        </Link>
        <div className="border-border bg-card rounded-xl border p-10 text-center">
          <p className="text-destructive text-sm font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => load(documentId)}
          >
            Retry
          </Button>
        </div>
      </main>
    );
  }

  if (!document || isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-10">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const canDelete = document.myRole === DocumentRole.OWNER;

  const handleDeleted = async (): Promise<void> => {
    try {
      await documentsApi.getCounters();
    } catch {
      // counters will be re-fetched when list page mounts
    }
    toast.message('Document removed', {
      description: `"${document.title}" has been deleted.`,
    });
    router.replace(APP_ROUTES.DOCUMENTS);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
      <Link
        href={APP_ROUTES.DOCUMENTS}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to documents
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <DocumentTitleEditor document={document} />
          <div className="flex items-center gap-2">
            <DocumentRoleBadge role={document.myRole} />
          </div>
        </div>
        {canDelete ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete document
          </Button>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="border-border bg-card flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <span className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-xl">
            <FileText className="size-6" />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Editor coming soon
            </h2>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
              Real-time collaborative editing lands in the next milestone. For
              now, you can rename, share, and manage members.
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DocumentMembersSection document={document} />
        </aside>
      </div>

      <DeleteDocumentDialog
        document={deleteOpen ? document : null}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
        onDeleted={handleDeleted}
      />
    </main>
  );
}