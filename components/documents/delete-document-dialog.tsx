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
import { documentsApi, type DocumentSummary } from '@/lib/documents';

interface DeleteDocumentDialogProps {
  document: Pick<DocumentSummary, 'id' | 'title'> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteDocumentDialog({
  document,
  onOpenChange,
  onDeleted,
}: DeleteDocumentDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!document) return;
    setIsDeleting(true);
    try {
      await documentsApi.remove(document.id);
      toast.success('Document deleted');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to delete document.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>
            <span className="text-foreground font-medium">{document?.title}</span> &nbsp;will
            be permanently removed for everyone with access. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}