'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { UserSearchMultiSelect } from '@/components/documents/user-search-multi-select';
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
  type AssignableDocumentRole,
  DOCUMENT_ROLE_LABELS,
  DocumentRole,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';
import { type User } from '@/lib/users';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  excludeIds: number[];
}

const ASSIGNABLE_ROLES: AssignableDocumentRole[] = [
  DocumentRole.EDITOR,
  DocumentRole.VIEWER,
];

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  excludeIds,
}: ShareDialogProps): React.JSX.Element {
  const reloadMembers = useDocumentDetailStore((state) => state.reloadMembers);
  const [selected, setSelected] = React.useState<User[]>([]);
  const [role, setRole] = React.useState<AssignableDocumentRole>(DocumentRole.EDITOR);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setRole(DocumentRole.EDITOR);
    }
  }, [open]);

  const handleSubmit = async (): Promise<void> => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await documentsApi.addMembers(documentId, {
        invites: selected.map((user) => ({ userId: user.id, role })),
      });
      toast.success(
        selected.length === 1
          ? `${selected[0].displayName} added`
          : `${selected.length} people added`,
      );
      onOpenChange(false);
      await reloadMembers();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to add members.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Search by name or email. Selected people will be added with the role
            you choose.
          </DialogDescription>
        </DialogHeader>

        <UserSearchMultiSelect
          selected={selected}
          onSelectedChange={setSelected}
          excludeIds={excludeIds}
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <Label>Role</Label>
          <div className="grid grid-cols-2 gap-2">
            {ASSIGNABLE_ROLES.map((assignable) => (
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selected.length === 0}
          >
            {isSubmitting
              ? 'Adding...'
              : `Invite ${selected.length || ''} as ${DOCUMENT_ROLE_LABELS[role]}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}