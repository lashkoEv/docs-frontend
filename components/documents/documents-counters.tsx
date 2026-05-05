'use client';

import { FileText, FolderOpen, Users } from 'lucide-react';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DocumentCounters } from '@/lib/documents';

interface DocumentsCountersProps {
  counters: DocumentCounters | null;
}

const cards = [
  { key: 'total', label: 'All documents', icon: FileText },
  { key: 'owned', label: 'Owned by me', icon: FolderOpen },
  { key: 'sharedWithMe', label: 'Shared with me', icon: Users },
] as const;

export function DocumentsCounters({ counters }: DocumentsCountersProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className={cn(
            'border-border bg-card flex items-center gap-4 rounded-xl border p-5',
          )}
        >
          <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </span>
            {counters ? (
              <span className="text-2xl font-semibold tabular-nums">
                {counters[key]}
              </span>
            ) : (
              <Skeleton className="mt-1 h-7 w-12" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}