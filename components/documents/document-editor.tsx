'use client';

import 'quill/dist/quill.snow.css';

import Quill from 'quill';
import Delta from 'quill-delta';
import QuillCursors from 'quill-cursors';
import * as React from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { DOCUMENT_VIEWER_NOTICE, DocumentRole } from '@/lib/documents';
import {
  OtClient,
  PRESENCE_CURSOR_IDLE_MS,
  PRESENCE_CURSOR_THROTTLE_MS,
  realtimeClient,
} from '@/lib/realtime';
import type {
  DocumentSnapshot,
  OtClientState,
  OtSendFn,
  OtRequestCatchupFn,
  PresenceParticipant,
  PresenceRange,
} from '@/lib/realtime';

interface DocumentEditorProps {
  documentId: number;
  myRole: DocumentRole | null;
  snapshot: DocumentSnapshot | null;
  participants: PresenceParticipant[];
  className?: string;
}

let cursorsRegistered = false;

function registerCursorsModule(): void {
  if (cursorsRegistered) {
    return;
  }
  Quill.register('modules/cursors', QuillCursors);
  cursorsRegistered = true;
}

export function DocumentEditor({
  documentId,
  myRole,
  snapshot,
  participants,
  className,
}: DocumentEditorProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const quillRef = React.useRef<Quill | null>(null);
  const otClientRef = React.useRef<OtClient | null>(null);
  const isApplyingRemoteRef = React.useRef(false);
  const participantsRef = React.useRef<PresenceParticipant[]>(participants);

  const [otState, setOtState] = React.useState<OtClientState>({
    revision: 0,
    status: 'idle',
    errorMessage: null,
    hasPending: false,
  });

  const isReadOnly = myRole === DocumentRole.VIEWER || myRole === null;

  const isReadOnlyRef = React.useRef(isReadOnly);
  React.useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);

  React.useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (snapshot === null) {
      return;
    }

    registerCursorsModule();

    const editorHost = document.createElement('div');
    editorHost.className = 'flex flex-1 flex-col';
    container.appendChild(editorHost);

    const initialReadOnly = isReadOnlyRef.current;
    const quill = new Quill(editorHost, {
      theme: 'snow',
      readOnly: initialReadOnly,
      placeholder: initialReadOnly ? '' : 'Start typing…',
      modules: {
        cursors: true,
        toolbar: initialReadOnly
          ? false
          : [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              ['link'],
              ['clean'],
            ],
      },
    });

    const cursors = quill.getModule('cursors') as QuillCursors;

    isApplyingRemoteRef.current = true;
    quill.setContents(new Delta(snapshot.content.ops), 'silent');
    isApplyingRemoteRef.current = false;

    const send: OtSendFn = async (payload) => {
      const ack = await realtimeClient.sendOperation({
        documentId,
        baseRevision: payload.baseRevision,
        delta: payload.delta,
      });
      if (!ack.ok) {
        return { ok: false, error: ack.error };
      }
      return {
        ok: true,
        revision: ack.revision,
        transformedDelta: ack.transformedDelta,
      };
    };

    const requestCatchup: OtRequestCatchupFn = async (sinceRevision) => {
      const ack = await realtimeClient.requestCatchup({
        documentId,
        sinceRevision,
      });
      if (!ack.ok) {
        return { ok: false, error: ack.error };
      }
      if (ack.action === 'full-resync') {
        return {
          ok: true,
          action: 'full-resync',
          content: ack.content,
          currentRevision: ack.currentRevision,
        };
      }
      return {
        ok: true,
        action: 'ops',
        ops: ack.ops,
        currentRevision: ack.currentRevision,
      };
    };

    const userId = useAuthStore.getState().user?.id ?? 0;
    const otClient = new OtClient({ send, requestCatchup, documentId, userId });
    otClient.setSnapshot(snapshot);

    const unsubscribeState = otClient.onStateChange((state) => {
      setOtState(state);
    });

    const unsubscribeContentDelta = otClient.onContentDelta((delta) => {
      isApplyingRemoteRef.current = true;
      quill.updateContents(delta, 'silent');
      isApplyingRemoteRef.current = false;
    });

    const unsubscribeContentSet = otClient.onContentSet((content) => {
      isApplyingRemoteRef.current = true;
      quill.setContents(content, 'silent');
      isApplyingRemoteRef.current = false;
    });

    const unsubscribeResync = otClient.onResync(({ droppedPending }) => {
      if (droppedPending) {
        toast.warning('Document reloaded — some unsaved changes were lost.');
      }
    });

    const unsubscribeRemote = realtimeClient.onRemoteOperation((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      if (event.clientId === realtimeClient.socketId()) {
        return;
      }
      otClient.onRemote(event);
    });

    const unsubscribeConnectionLost = realtimeClient.onConnectionLost(() => {
      otClient.suspend();
    });

    const unsubscribeReconnected = realtimeClient.onReconnected(() => {
      void otClient.resync();
    });

    const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const dropCursor = (socketId: string): void => {
      cursors.removeCursor(socketId);
      const timer = idleTimers.get(socketId);
      if (timer !== undefined) {
        clearTimeout(timer);
        idleTimers.delete(socketId);
      }
    };

    const unsubscribeCursor = realtimeClient.onPresenceCursor((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      if (event.socketId === realtimeClient.socketId()) {
        return;
      }
      if (!event.range) {
        dropCursor(event.socketId);
        return;
      }
      const participant = participantsRef.current.find(
        (entry) => entry.socketId === event.socketId,
      );
      if (!participant) {
        return;
      }
      cursors.createCursor(event.socketId, participant.displayName, participant.color);
      cursors.moveCursor(event.socketId, event.range);

      const existing = idleTimers.get(event.socketId);
      if (existing !== undefined) {
        clearTimeout(existing);
      }
      idleTimers.set(
        event.socketId,
        setTimeout(() => dropCursor(event.socketId), PRESENCE_CURSOR_IDLE_MS),
      );
    });

    const unsubscribeLeft = realtimeClient.onPresenceLeft((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      dropCursor(event.socketId);
    });

    let cursorTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingRange: PresenceRange | null = null;
    const sendCursorThrottled = (range: PresenceRange | null): void => {
      pendingRange = range;
      if (cursorTimer !== null) {
        return;
      }
      cursorTimer = setTimeout(() => {
        cursorTimer = null;
        realtimeClient.sendCursor(documentId, pendingRange);
      }, PRESENCE_CURSOR_THROTTLE_MS);
    };

    quill.on('text-change', (delta, _oldContents, source) => {
      if (source !== 'user') {
        return;
      }
      if (isApplyingRemoteRef.current) {
        return;
      }
      otClient.apply(delta);
    });

    quill.on('selection-change', (range) => {
      sendCursorThrottled(range ? { index: range.index, length: range.length } : null);
    });

    quillRef.current = quill;
    otClientRef.current = otClient;

    const recovery = otClient.recoverPending();
    if (recovery.recovered) {
      toast.info('Restored your unsent changes.');
    } else if (recovery.droppedStale) {
      toast.warning('Document changed while you were away — some unsaved changes were lost.');
    }

    const handleBeforeUnload = (): void => {
      otClient.flushPersist();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeState();
      unsubscribeContentDelta();
      unsubscribeContentSet();
      unsubscribeResync();
      unsubscribeRemote();
      unsubscribeConnectionLost();
      unsubscribeReconnected();
      unsubscribeCursor();
      unsubscribeLeft();
      if (cursorTimer !== null) {
        clearTimeout(cursorTimer);
      }
      idleTimers.forEach((timer) => clearTimeout(timer));
      idleTimers.clear();
      otClient.destroy();
      otClientRef.current = null;
      quillRef.current = null;
      container.innerHTML = '';
    };
  }, [documentId, snapshot]);

  React.useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    quill.enable(!isReadOnly);
  }, [isReadOnly]);

  React.useEffect(() => {
    if (otState.status !== 'error' || !otState.errorMessage) {
      return;
    }
    toast.error(otState.errorMessage);
  }, [otState.status, otState.errorMessage]);

  if (snapshot === null) {
    return (
      <section
        className={cn(
          'border-border bg-card flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-12 text-center',
          className,
        )}
      >
        <p className="text-muted-foreground text-sm">Loading document…</p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'border-border bg-card flex min-h-[400px] flex-col rounded-xl border',
        className,
      )}
    >
      {isReadOnly ? (
        <p className="text-muted-foreground border-border bg-muted/30 border-b px-4 py-2 text-xs">
          {DOCUMENT_VIEWER_NOTICE}
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="flex min-h-[360px] flex-1 flex-col text-base leading-relaxed"
      />
      <footer className="text-muted-foreground border-border bg-muted/30 flex items-center justify-between rounded-b-xl border-t px-4 py-2 text-[11px]">
        <span>Revision {otState.revision}</span>
        <span>{otStatusLabel(otState)}</span>
      </footer>
    </section>
  );
}

function otStatusLabel(state: OtClientState): string {
  if (state.status === 'sending') {
    return 'Saving…';
  }
  if (state.status === 'syncing') {
    return 'Syncing…';
  }
  if (state.status === 'error') {
    return state.errorMessage ?? 'Error';
  }
  if (state.hasPending) {
    return 'Pending changes';
  }
  return 'Saved';
}