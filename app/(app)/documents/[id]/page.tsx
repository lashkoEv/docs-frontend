'use client';

import { ArrowLeft, History, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { DocumentEditor } from '@/components/documents/document-editor';
import { DocumentMembersSection } from '@/components/documents/document-members-section';
import { DocumentRoleBadge } from '@/components/documents/document-role-badge';
import { DocumentTitleEditor } from '@/components/documents/document-title-editor';
import { PresenceRoster } from '@/components/documents/presence-roster';
import { RealtimeIndicator } from '@/components/documents/realtime-indicator';
import { VersionHistoryPanel } from '@/components/documents/version-history-panel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DocumentRole,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';
import { useDocumentRoom, usePresence } from '@/lib/realtime';
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
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const realtime = useDocumentRoom(isValidId ? documentId : null);
  const participants = usePresence(isValidId ? documentId : null);

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

  const effectiveRole = realtime.myRole ?? document.myRole;
  const canDelete = document.myRole === DocumentRole.OWNER;
  const canRestore =
    effectiveRole === DocumentRole.OWNER || effectiveRole === DocumentRole.EDITOR;

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
          <div className="flex flex-wrap items-center gap-2">
            <DocumentRoleBadge role={document.myRole} />
            <RealtimeIndicator
              status={realtime.status}
              errorMessage={realtime.errorMessage}
            />
            <PresenceRoster participants={participants} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="size-4" />
            History
          </Button>
          {canDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Document actions"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-20">
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {realtime.joinError ? (
          <section className="border-border bg-card flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border p-12 text-center">
            <p className="text-foreground text-sm font-medium">
              {realtime.joinError}
            </p>
            <p className="text-muted-foreground text-sm">
              You no longer have access to this document.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href={APP_ROUTES.DOCUMENTS}>Back to documents</Link>
            </Button>
          </section>
        ) : (
          <DocumentEditor
            documentId={documentId}
            myRole={realtime.myRole ?? document.myRole}
            snapshot={realtime.snapshot}
            participants={participants}
          />
        )}

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

      <VersionHistoryPanel
        documentId={documentId}
        open={historyOpen}
        canRestore={canRestore}
        onOpenChange={setHistoryOpen}
        onRestored={() => setHistoryOpen(false)}
      />
    </main>
  );
}