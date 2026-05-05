'use client';

import { Loader2, Search, X } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';
import { type User, usersApi } from '@/lib/users';
import { cn } from '@/lib/utils';

interface UserSearchMultiSelectProps {
  selected: User[];
  onSelectedChange: (users: User[]) => void;
  excludeIds?: number[];
  placeholder?: string;
  disabled?: boolean;
}

const PAGE_LIMIT = 10;
const DEBOUNCE_MS = 250;

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function UserSearchMultiSelect({
  selected,
  onSelectedChange,
  excludeIds = [],
  placeholder = 'Search by name or email',
  disabled,
}: UserSearchMultiSelectProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedIds = React.useMemo(
    () => selected.map((user) => user.id),
    [selected],
  );

  const combinedExcluded = React.useMemo(
    () => Array.from(new Set([...excludeIds, ...selectedIds])),
    [excludeIds, selectedIds],
  );

  const fetchUsers = React.useCallback(
    async (query: string, exclude: number[]): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await usersApi.findAll({
          search: query.trim() || undefined,
          excludeIds: exclude.length > 0 ? exclude : undefined,
          limit: PAGE_LIMIT,
          offset: 0,
        });
        setResults(response.items);
      } catch (caught) {
        setError(isApiError(caught) ? caught.message : 'Failed to search users');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const handle = setTimeout(() => {
      void fetchUsers(search, combinedExcluded);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search, combinedExcluded, fetchUsers]);

  const toggleUser = (user: User): void => {
    if (selectedIds.includes(user.id)) {
      onSelectedChange(selected.filter((current) => current.id !== user.id));
    } else {
      onSelectedChange([...selected, user]);
    }
  };

  const removeUser = (userId: number): void => {
    onSelectedChange(selected.filter((current) => current.id !== userId));
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 ? (
        <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
          {selected.map((user) => (
            <span
              key={user.id}
              className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {user.displayName}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:text-primary/70"
                aria-label={`Remove ${user.displayName}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 pl-9"
        />
      </div>

      <div className="border-border h-64 overflow-y-auto rounded-md border">
        {error ? (
          <p className="text-destructive p-4 text-sm">{error}</p>
        ) : isLoading && results.length === 0 ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center px-4 text-center text-sm">
            {search ? 'No matching users' : 'No users to invite'}
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {results.map((user) => {
              const isSelected = selectedIds.includes(user.id);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => toggleUser(user)}
                    disabled={disabled}
                    className={cn(
                      'hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {getInitials(user.displayName)}
                    </span>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium">
                        {user.displayName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="text-primary text-xs font-medium">Selected</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
            {isLoading ? (
              <li className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Searching...
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}