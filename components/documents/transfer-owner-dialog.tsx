'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isApiError } from '@/lib/api/errors';
import {
  type DocumentMember,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';

interface TransferOwnerDialogProps {
  member: DocumentMember | null;
  documentId: number;
  onOpenChange: (open: boolean) => void;
}

export function TransferOwnerDialog({
  member,
  documentId,
  onOpenChange,
}: TransferOwnerDialogProps): React.JSX.Element {
  const setDocument = useDocumentDetailStore((state) => state.setDocument);
  const reloadMembers = useDocumentDetailStore((state) => state.reloadMembers);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (!member) return;
    setIsSubmitting(true);
    try {
      const updated = await documentsApi.transferOwner(documentId, {
        userId: member.user.id,
      });
      setDocument(updated);
      toast.success(`Ownership transferred to ${member.user.displayName}`);
      onOpenChange(false);
      await reloadMembers();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to transfer ownership.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer ownership?</DialogTitle>
          <DialogDescription>
            <span className="text-foreground font-medium">
              {member?.user.displayName}
            </span>{' '}
            will become the owner. You will be downgraded to editor and lose the
            ability to delete the document or change members.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Transferring...' : 'Transfer ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}