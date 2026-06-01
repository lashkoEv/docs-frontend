'use client';

import { ArrowUpDown, Check, Search, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { DocumentOrderBy, useDocumentsStore } from '@/lib/documents';
import { OrderDirection } from '@/lib/shared';
import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 300;

const sortOptions = [
  { orderBy: DocumentOrderBy.UPDATED_AT, orderDirection: OrderDirection.DESC, label: 'Recently updated' },
  { orderBy: DocumentOrderBy.UPDATED_AT, orderDirection: OrderDirection.ASC, label: 'Least recently updated' },
  { orderBy: DocumentOrderBy.CREATED_AT, orderDirection: OrderDirection.DESC, label: 'Newest first' },
  { orderBy: DocumentOrderBy.CREATED_AT, orderDirection: OrderDirection.ASC, label: 'Oldest first' },
  { orderBy: DocumentOrderBy.TITLE, orderDirection: OrderDirection.ASC, label: 'Title A–Z' },
  { orderBy: DocumentOrderBy.TITLE, orderDirection: OrderDirection.DESC, label: 'Title Z–A' },
] as const;

export function DocumentsToolbar(): React.JSX.Element {
  const orderBy = useDocumentsStore((state) => state.query.orderBy);
  const orderDirection = useDocumentsStore((state) => state.query.orderDirection);
  const setSearch = useDocumentsStore((state) => state.setSearch);
  const setOrder = useDocumentsStore((state) => state.setOrder);

  const [value, setValue] = React.useState(
    () => useDocumentsStore.getState().query.search ?? '',
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void setSearch(value);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, setSearch]);

  const activeLabel =
    sortOptions.find(
      (option) => option.orderBy === orderBy && option.orderDirection === orderDirection,
    )?.label ?? 'Sort';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search documents by title"
          className="bg-card h-10 pl-9"
        />
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-card h-10 justify-between gap-2 sm:w-56">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="size-4" />
              {activeLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {sortOptions.map((option) => {
            const isActive =
              option.orderBy === orderBy && option.orderDirection === orderDirection;
            return (
              <DropdownMenuItem
                key={`${option.orderBy}-${option.orderDirection}`}
                onSelect={() => void setOrder(option.orderBy, option.orderDirection)}
                className="justify-between"
              >
                {option.label}
                <Check className={cn('size-4', isActive ? 'opacity-100' : 'opacity-0')} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}