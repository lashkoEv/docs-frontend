'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { isApiError } from '@/lib/api/errors';
import {
  CreateDocumentInput,
  createDocumentSchema,
  documentsApi,
  useDocumentsStore,
} from '@/lib/documents';
import { APP_ROUTES } from '@/lib/shared';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
}: CreateDocumentDialogProps): React.JSX.Element {
  const router = useRouter();
  const refresh = useDocumentsStore((state) => state.refresh);

  const form = useForm<CreateDocumentInput>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: { title: '' },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ title: '' });
    }
  }, [open, form]);

  const onSubmit = async (values: CreateDocumentInput): Promise<void> => {
    try {
      const document = await documentsApi.create(values);
      toast.success('Document created');
      onOpenChange(false);
      await refresh();
      router.push(`${APP_ROUTES.DOCUMENTS}/${document.id}`);
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to create document. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Give it a name. You can rename it later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Untitled"
                      autoComplete="off"
                      autoFocus
                      className="h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create document'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}