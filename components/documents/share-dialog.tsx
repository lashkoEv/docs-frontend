'use client';

import { Loader2, Mail, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { isApiError } from '@/lib/api/errors';
import {
  ASSIGNABLE_DOCUMENT_ROLES,
  type AssignableDocumentRole,
  DOCUMENT_ROLE_LABELS,
  DocumentRole,
  useDocumentDetailStore,
} from '@/lib/documents';
import {
  CHIP_DELIMITER_RE,
  invitationsApi,
  INVITATION_MAX_RECIPIENTS,
  INVITATION_SEARCH_DEBOUNCE_MS,
  INVITATION_SUGGESTIONS_LIMIT,
  type InviteChipItem,
} from '@/lib/invitations';
import { EMAIL_RE, getInitials } from '@/lib/shared';
import { type User, usersApi } from '@/lib/users';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  excludeIds: number[];
}

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  excludeIds,
}: ShareDialogProps): React.JSX.Element {
  const reloadMembers = useDocumentDetailStore((state) => state.reloadMembers);
  const reloadPendingInvitations = useDocumentDetailStore(
    (state) => state.reloadPendingInvitations,
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [chips, setChips] = React.useState<InviteChipItem[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [role, setRole] = React.useState<AssignableDocumentRole>(DocumentRole.EDITOR);
  const [suggestions, setSuggestions] = React.useState<User[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChips([]);
      setInputValue('');
      setRole(DocumentRole.EDITOR);
      setSuggestions([]);
      setIsFocused(false);
    }
  }, [open]);

  const trimmedInput = inputValue.trim();
  const chippedUserIds = React.useMemo(
    () => chips.map((chip) => chip.userId).filter((value): value is number => value !== undefined),
    [chips],
  );
  const chippedEmails = React.useMemo(
    () => new Set(chips.map((chip) => chip.email.toLowerCase())),
    [chips],
  );
  const combinedExcludeIds = React.useMemo(
    () => Array.from(new Set([...excludeIds, ...chippedUserIds])),
    [excludeIds, chippedUserIds],
  );

  React.useEffect(() => {
    if (trimmedInput.length < 1) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await usersApi.findAll({
          search: trimmedInput,
          excludeIds: combinedExcludeIds.length > 0 ? combinedExcludeIds : undefined,
          limit: INVITATION_SUGGESTIONS_LIMIT,
          offset: 0,
        });
        if (!cancelled) {
          setSuggestions(
            response.items.filter((user) => !chippedEmails.has(user.email.toLowerCase())),
          );
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, INVITATION_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmedInput, combinedExcludeIds, chippedEmails]);

  const addChip = (chip: InviteChipItem): boolean => {
    const normalized = chip.email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return false;
    if (chippedEmails.has(normalized)) return false;
    if (chips.length >= INVITATION_MAX_RECIPIENTS) {
      toast.error(`Maximum ${INVITATION_MAX_RECIPIENTS} recipients per invite`);
      return false;
    }
    setChips((prev) => [...prev, { ...chip, email: normalized }]);
    return true;
  };

  const removeChip = (email: string): void => {
    setChips((prev) => prev.filter((chip) => chip.email !== email));
  };

  const flushPendingInput = (): boolean => {
    if (!trimmedInput) return true;
    const tokens = trimmedInput.split(CHIP_DELIMITER_RE).filter(Boolean);
    let allValid = true;
    for (const candidate of tokens) {
      const ok = addChip({ email: candidate });
      if (!ok) allValid = false;
    }
    if (allValid) setInputValue('');
    return allValid;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      if (trimmedInput) {
        event.preventDefault();
        flushPendingInput();
      } else if (event.key === 'Enter' && chips.length > 0 && !isSubmitting) {
        event.preventDefault();
        void handleSubmit();
      }
      return;
    }
    if (event.key === 'Backspace' && !inputValue && chips.length > 0) {
      event.preventDefault();
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const handlePickSuggestion = (user: User): void => {
    addChip({ email: user.email, userId: user.id, displayName: user.displayName });
    setInputValue('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const canSubmit = chips.length > 0 && !isSubmitting;

  const handleSubmit = async (): Promise<void> => {
    flushPendingInput();
    const emails = chips.map((chip) => chip.email);
    if (emails.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await invitationsApi.inviteBulk(documentId, { emails, role });

      const parts: string[] = [];
      if (result.granted.length) parts.push(`${result.granted.length} added`);
      if (result.invited.length) parts.push(`${result.invited.length} invited`);
      if (result.errors.length)
        parts.push(`${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`);
      const summary = parts.join(', ');

      if (result.errors.length === 0) {
        toast.success(summary || 'Done');
      } else if (result.granted.length === 0 && result.invited.length === 0) {
        toast.error(summary);
      } else {
        toast.warning(summary);
      }

      result.errors.slice(0, 5).forEach((item) => {
        toast.error(`${item.email}: ${item.message}`);
      });

      const refreshes: Array<Promise<void>> = [];
      if (result.granted.length > 0) refreshes.push(reloadMembers());
      if (result.invited.length > 0) refreshes.push(reloadPendingInvitations());
      if (refreshes.length > 0) await Promise.all(refreshes);

      if (result.errors.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to send invitations.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmailInput = EMAIL_RE.test(trimmedInput);
  const isAlreadyChipped = chippedEmails.has(trimmedInput.toLowerCase());
  const showPopover = isFocused && trimmedInput.length >= 1;
  const showEmailCta =
    !isSearching &&
    suggestions.length === 0 &&
    isValidEmailInput &&
    !isAlreadyChipped;
  const showNoMatchHint = !isSearching && suggestions.length === 0 && !isValidEmailInput;

  const handleInviteByEmail = (): void => {
    if (addChip({ email: trimmedInput })) {
      setInputValue('');
      setSuggestions([]);
    }
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite by email</DialogTitle>
          <DialogDescription>
            Existing users get instant access. New emails get an invitation link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="invite-email">Recipients</Label>
          <div className="relative">
            <div
              role="presentation"
              onClick={() => inputRef.current?.focus()}
              className={cn(
                'border-input flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 text-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
                isSubmitting && 'opacity-60',
              )}
            >
              {chips.map((chip) => (
                <Badge
                  key={chip.email}
                  variant="secondary"
                  className="gap-1 pr-1 pl-2 py-0.5"
                >
                  <span className="max-w-[200px] truncate">{chip.email}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeChip(chip.email);
                    }}
                    disabled={isSubmitting}
                    aria-label={`Remove ${chip.email}`}
                    className="text-muted-foreground hover:text-foreground inline-flex size-4 items-center justify-center rounded-sm transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <input
                ref={inputRef}
                id="invite-email"
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 150);
                }}
                placeholder={chips.length === 0 ? 'someone@example.com' : ''}
                disabled={isSubmitting || chips.length >= INVITATION_MAX_RECIPIENTS}
                className="placeholder:text-muted-foreground min-w-[160px] flex-1 bg-transparent outline-none"
              />
            </div>

            {showPopover ? (
              <ul
                className="bg-popover text-popover-foreground border-border divide-border absolute top-full right-0 left-0 z-50 mt-1 max-h-60 divide-y overflow-y-auto rounded-md border shadow-md"
              >
                {suggestions.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handlePickSuggestion(user)}
                      disabled={isSubmitting}
                      className="hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
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
                    </button>
                  </li>
                ))}
                {isSearching ? (
                  <li className="text-muted-foreground flex items-center justify-center gap-2 py-3 text-xs">
                    <Loader2 className="size-3 animate-spin" />
                    Searching...
                  </li>
                ) : null}
                {showEmailCta ? (
                  <li>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleInviteByEmail}
                      disabled={isSubmitting}
                      className="hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    >
                      <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Mail className="size-4" />
                      </span>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          Invite &laquo;{trimmedInput}&raquo;
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          User not on Docs Lite — we&apos;ll send an invitation link
                        </span>
                      </div>
                    </button>
                  </li>
                ) : null}
                {showNoMatchHint ? (
                  <li className="text-muted-foreground px-3 py-3 text-center text-xs">
                    No matching users. Type a full email to invite.
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            Press Enter or comma to add. Up to {INVITATION_MAX_RECIPIENTS} per invite.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <div className="grid grid-cols-2 gap-2">
            {ASSIGNABLE_DOCUMENT_ROLES.map((assignable) => (
              <button
                key={assignable}
                type="button"
                onClick={() => setRole(assignable)}
                disabled={isSubmitting}
                className={cn(
                  'border-border flex flex-col items-start rounded-md border p-3 text-left transition-colors',
                  role === assignable
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40',
                )}
              >
                <span className="text-sm font-medium">
                  {DOCUMENT_ROLE_LABELS[assignable]}
                </span>
                <span className="text-muted-foreground mt-0.5 text-xs">
                  {assignable === DocumentRole.EDITOR
                    ? 'Can edit content and rename'
                    : 'Can read but not edit'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting
              ? 'Sending...'
              : `Invite ${chips.length || ''} as ${DOCUMENT_ROLE_LABELS[role]}`.replace(
                  '  ',
                  ' ',
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}