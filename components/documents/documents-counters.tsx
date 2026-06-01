'use client';

import { FileText, FolderOpen, Users } from 'lucide-react';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { type DocumentCounters, DocumentFilter } from '@/lib/documents';
import { cn } from '@/lib/utils';

interface DocumentsCountersProps {
  counters: DocumentCounters | null;
  activeFilter: DocumentFilter;
  onSelect: (filter: DocumentFilter) => void;
}

const cards = [
  { key: 'total', filter: DocumentFilter.ALL, label: 'All documents', icon: FileText },
  { key: 'owned', filter: DocumentFilter.OWNED, label: 'Owned by me', icon: FolderOpen },
  {
    key: 'sharedWithMe',
    filter: DocumentFilter.SHARED,
    label: 'Shared with me',
    icon: Users,
  },
] as const;

export function DocumentsCounters({
  counters,
  activeFilter,
  onSelect,
}: DocumentsCountersProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ key, filter, label, icon: Icon }) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(filter)}
            className={cn(
              'flex items-center gap-4 rounded-xl border p-5 text-left transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              isActive
                ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <span
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-lg',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {label}
              </span>
              {counters ? (
                <span className="text-2xl font-semibold tabular-nums">{counters[key]}</span>
              ) : (
                <Skeleton className="mt-1 h-7 w-12" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}