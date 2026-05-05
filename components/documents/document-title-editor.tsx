'use client';

import { Check, Pencil, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isApiError } from '@/lib/api/errors';
import {
  type Document,
  DOCUMENT_TITLE_MAX_LENGTH,
  DocumentRole,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';

interface DocumentTitleEditorProps {
  document: Document;
}

export function DocumentTitleEditor({ document }: DocumentTitleEditorProps): React.JSX.Element {
  const setDocument = useDocumentDetailStore((state) => state.setDocument);
  const canEdit = document.myRole <= DocumentRole.EDITOR;

  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(document.title);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(document.title);
  }, [document.title]);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancel = (): void => {
    setValue(document.title);
    setEditing(false);
  };

  const save = async (): Promise<void> => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === document.title) {
      cancel();
      return;
    }
    if (trimmed.length > DOCUMENT_TITLE_MAX_LENGTH) {
      toast.error(`Title must be at most ${DOCUMENT_TITLE_MAX_LENGTH} characters`);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await documentsApi.update(document.id, { title: trimmed });
      setDocument(updated);
      setEditing(false);
      toast.success('Title updated');
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to update title.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => canEdit && setEditing(true)}
        disabled={!canEdit}
        className="group flex max-w-full items-center gap-2 text-left disabled:cursor-default"
      >
        <h1 className="truncate text-3xl font-semibold tracking-tight">
          {document.title}
        </h1>
        {canEdit ? (
          <Pencil className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="flex max-w-full items-center gap-1.5"
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cancel();
          }
        }}
        disabled={isSaving}
        maxLength={DOCUMENT_TITLE_MAX_LENGTH}
        className="h-10 max-w-md text-base"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isSaving}
        aria-label="Save title"
        className="size-10 shrink-0"
      >
        <Check className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={cancel}
        disabled={isSaving}
        aria-label="Cancel"
        className="text-muted-foreground hover:text-foreground size-10 shrink-0"
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}