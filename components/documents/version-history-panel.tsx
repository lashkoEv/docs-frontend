'use client';

import 'quill/dist/quill.snow.css';

import { History, RotateCcw, X } from 'lucide-react';
import Quill from 'quill';
import Delta from 'quill-delta';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getErrorMessage, toastApiError } from '@/lib/api/errors';
import {
  type Document,
  type DocumentVersion,
  documentsApi,
} from '@/lib/documents';
import { formatShortDate } from '@/lib/shared';
import type { User } from '@/lib/users';
import { cn } from '@/lib/utils';

interface VersionHistoryPanelProps {
  documentId: number;
  open: boolean;
  canRestore: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

const ADDED_HIGHLIGHT = 'rgba(34, 197, 94, 0.28)';
const REMOVED_HIGHLIGHT = 'rgba(239, 68, 68, 0.22)';

interface VersionRow {
  key: string;
  revision: number;
  author: User | null;
  createdAt: string;
  isCurrent: boolean;
}

interface PreviewState {
  key: string;
  revision: number;
  isCurrent: boolean;
  highlighted: Delta;
}

function isDocumentDelta(delta: Delta): boolean {
  return delta.ops.every((op) => op.insert !== undefined);
}

function markAllAdded(delta: Delta): Delta {
  if (!isDocumentDelta(delta)) {
    return delta;
  }
  const result = new Delta();
  delta.ops.forEach((op) => {
    result.push({
      ...op,
      attributes: { ...op.attributes, background: ADDED_HIGHLIGHT },
    });
  });
  return result;
}

function buildHighlightedDelta(current: Delta, previous: Delta | null): Delta {
  if (!previous) {
    return markAllAdded(current);
  }
  if (!isDocumentDelta(current) || !isDocumentDelta(previous)) {
    return current;
  }

  let diff: Delta;
  try {
    diff = previous.diff(current);
  } catch {
    return current;
  }

  const result = new Delta();
  let currentIndex = 0;
  let previousIndex = 0;

  diff.ops.forEach((op) => {
    if (typeof op.insert === 'string') {
      const slice = current.slice(currentIndex, currentIndex + op.insert.length);
      slice.ops.forEach((sliceOp) => {
        result.push({
          ...sliceOp,
          attributes: { ...sliceOp.attributes, background: ADDED_HIGHLIGHT },
        });
      });
      currentIndex += op.insert.length;
    } else if (typeof op.delete === 'number') {
      const slice = previous.slice(previousIndex, previousIndex + op.delete);
      slice.ops.forEach((sliceOp) => {
        if (typeof sliceOp.insert !== 'string') {
          return;
        }
        result.push({
          ...sliceOp,
          attributes: {
            ...sliceOp.attributes,
            background: REMOVED_HIGHLIGHT,
            strike: true,
          },
        });
      });
      previousIndex += op.delete;
    } else if (typeof op.retain === 'number') {
      const slice = current.slice(currentIndex, currentIndex + op.retain);
      slice.ops.forEach((sliceOp) => result.push(sliceOp));
      currentIndex += op.retain;
      previousIndex += op.retain;
    }
  });

  const tail = current.slice(currentIndex);
  tail.ops.forEach((sliceOp) => result.push(sliceOp));

  return result;
}

export function VersionHistoryPanel({
  documentId,
  open,
  canRestore,
  onOpenChange,
  onRestored,
}: VersionHistoryPanelProps): React.JSX.Element | null {
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const quillRef = React.useRef<Quill | null>(null);

  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [current, setCurrent] = React.useState<Document | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewState | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setPreview(null);

    const load = async (): Promise<void> => {
      try {
        const [versionList, document] = await Promise.all([
          documentsApi.listVersions(documentId),
          documentsApi.getById(documentId),
        ]);
        if (!cancelled) {
          setVersions(versionList);
          setCurrent(document);
        }
      } catch (error) {
        if (!cancelled) {
          toastApiError(error, 'Unable to load history.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, documentId]);

  React.useEffect(() => {
    const host = previewRef.current;
    if (!host || !preview) {
      return;
    }

    const quill = new Quill(host, { theme: 'snow', readOnly: true, modules: { toolbar: false } });
    quill.setContents(preview.highlighted, 'silent');
    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      host.innerHTML = '';
    };
  }, [preview]);

  const rows = React.useMemo<VersionRow[]>(() => {
    const snapshotRows: VersionRow[] = versions.map((version) => ({
      key: `snap-${version.revision}`,
      revision: version.revision,
      author: version.author,
      createdAt: version.createdAt,
      isCurrent: false,
    }));

    const latestSnapshotRevision = versions[0]?.revision ?? -1;
    if (current && current.revision > latestSnapshotRevision) {
      return [
        {
          key: 'current',
          revision: current.revision,
          author: null,
          createdAt: current.updatedAt,
          isCurrent: true,
        },
        ...snapshotRows,
      ];
    }

    return snapshotRows;
  }, [versions, current]);

  const selectRow = async (row: VersionRow): Promise<void> => {
    setIsPreviewLoading(true);
    try {
      const snapshotIndex = versions.findIndex(
        (version) => version.revision === row.revision,
      );

      const olderVersion = row.isCurrent
        ? versions[0]
        : versions[snapshotIndex + 1];

      const [currentContent, older] = await Promise.all([
        row.isCurrent
          ? Promise.resolve(current)
          : documentsApi.getVersion(documentId, row.revision),
        olderVersion
          ? documentsApi.getVersion(documentId, olderVersion.revision)
          : Promise.resolve(null),
      ]);

      if (!currentContent) {
        throw new Error('Version content unavailable');
      }

      const currentDelta = new Delta(currentContent.content.ops);
      const previousDelta = older ? new Delta(older.content.ops) : null;

      setPreview({
        key: row.key,
        revision: row.revision,
        isCurrent: row.isCurrent,
        highlighted: buildHighlightedDelta(currentDelta, previousDelta),
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load version.'));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    if (!preview || preview.isCurrent) {
      return;
    }
    setIsRestoring(true);
    try {
      await documentsApi.restoreVersion(documentId, preview.revision);
      toast.success(`Restored version from revision ${preview.revision}`);
      onRestored();
      onOpenChange(false);
    } catch (error) {
      toastApiError(error, 'Unable to restore version.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!open) {
    return null;
  }

  const showRestore = canRestore && preview !== null && !preview.isCurrent;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close history"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <aside className="bg-card border-border relative flex h-full w-full max-w-md flex-col border-l shadow-xl">
        <header className="border-border flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="size-4" />
            <h2 className="text-base font-semibold tracking-tight">Version history</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            className="size-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border max-h-60 shrink-0 overflow-y-auto border-b">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No versions yet. Versions are saved automatically as the document is edited.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {rows.map((row) => (
                  <li key={row.key}>
                    <button
                      type="button"
                      onClick={() => selectRow(row)}
                      className={cn(
                        'hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                        preview?.key === row.key && 'bg-muted/60',
                      )}
                    >
                      {row.author ? (
                        <UserAvatar displayName={row.author.displayName} avatar={row.author.avatar} />
                      ) : (
                        <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                          —
                        </span>
                      )}
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {row.isCurrent
                            ? 'Current version'
                            : (row.author?.displayName ?? 'Unknown')}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Revision {row.revision} · {formatShortDate(row.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {isPreviewLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : preview ? (
              <>
                <p className="text-muted-foreground border-border bg-muted/30 flex flex-wrap items-center gap-x-1 gap-y-1 border-b px-4 py-2 text-xs">
                  <span>Changes since the previous version:</span>
                  <span
                    className="rounded px-1"
                    style={{ backgroundColor: ADDED_HIGHLIGHT }}
                  >
                    added
                  </span>
                  <span
                    className="rounded px-1 line-through"
                    style={{ backgroundColor: REMOVED_HIGHLIGHT }}
                  >
                    removed
                  </span>
                </p>
                <div className="flex-1 overflow-y-auto p-2 text-sm">
                  <div ref={previewRef} />
                </div>
                {showRestore ? (
                  <footer className="border-border border-t p-3">
                    <Button
                      className="w-full"
                      disabled={isRestoring}
                      onClick={handleRestore}
                    >
                      <RotateCcw className="size-4" />
                      {isRestoring ? 'Restoring…' : 'Restore this version'}
                    </Button>
                  </footer>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground p-6 text-center text-sm">
                Select a version to preview it.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}