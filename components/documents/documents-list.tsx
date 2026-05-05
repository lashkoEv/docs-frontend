'use client';

import { FileText, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { DocumentRoleBadge } from '@/components/documents/document-role-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type DocumentSummary,
  DocumentRole,
  useDocumentsStore,
} from '@/lib/documents';
import { APP_ROUTES } from '@/lib/shared';

interface DocumentsListProps {
  onRequestDelete: (document: DocumentSummary) => void;
  onRequestNew: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function DocumentsList({
  onRequestDelete,
  onRequestNew,
}: DocumentsListProps): React.JSX.Element {
  const list = useDocumentsStore((state) => state.list);
  const isLoading = useDocumentsStore((state) => state.isLoading);
  const isLoadingMore = useDocumentsStore((state) => state.isLoadingMore);
  const error = useDocumentsStore((state) => state.error);
  const fetchList = useDocumentsStore((state) => state.fetchList);
  const loadMore = useDocumentsStore((state) => state.loadMore);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const hasMore = list ? list.items.length < list.pagination.total : false;

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (error && !list) {
    return (
      <div className="border-border bg-card rounded-xl border p-10 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchList()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!list && isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!list || list.items.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-16 text-center">
        <span className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-xl">
          <FileText className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">No documents yet</h2>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
            Create your first document to start writing with your team.
          </p>
        </div>
        <Button size="sm" onClick={onRequestNew}>
          New document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
        {list.items.map((document) => (
          <li
            key={document.id}
            className="hover:bg-muted/40 flex items-center gap-4 px-4 py-3 transition-colors"
          >
            <Link
              href={`${APP_ROUTES.DOCUMENTS}/${document.id}`}
              className="flex flex-1 items-center gap-3 overflow-hidden"
            >
              <span className="bg-muted text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" />
              </span>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{document.title}</span>
                <span className="text-muted-foreground text-xs">
                  Updated {dateFormatter.format(new Date(document.updatedAt))}
                </span>
              </div>
            </Link>

            <DocumentRoleBadge role={document.myRole} />

            {document.myRole === DocumentRole.OWNER ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Document actions"
                    className="size-8"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onRequestDelete(document)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="size-8" aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-xs"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Loading more...
            </>
          ) : (
            <span>Scroll to load more</span>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-xs">
          {list.pagination.total === 1
            ? '1 document'
            : `${list.pagination.total} documents`}
        </p>
      )}
    </div>
  );
}