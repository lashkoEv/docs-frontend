import Delta from 'quill-delta';

import type { DocumentContentJson } from '@/lib/documents';

import { otBackoff, RATE_LIMITED_RE } from './realtime.constants';
import type {
  DocumentOperationBroadcast,
  DocumentSnapshot,
  OtClientOptions,
  OtClientState,
  OtContentDeltaListener,
  OtContentSetListener,
  OtListener,
  OtResyncListener,
  OtSendResult,
  OtStatus,
} from './realtime.types';

export class OtClient {
  private committed: Delta = new Delta();
  private revision: number = 0;
  private inFlight: Delta | null = null;
  private inFlightBaseRev: number = 0;
  private buffered: Delta = new Delta();
  private status: OtStatus = 'idle';
  private errorMessage: string | null = null;
  private retryDelayMs: number = otBackoff.baseDelayMs;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed: boolean = false;
  private suspended: boolean = false;
  private sending: boolean = false;

  private readonly stateListeners = new Set<OtListener>();
  private readonly contentDeltaListeners = new Set<OtContentDeltaListener>();
  private readonly contentSetListeners = new Set<OtContentSetListener>();
  private readonly resyncListeners = new Set<OtResyncListener>();

  constructor(private readonly options: OtClientOptions) {}

  destroy(): void {
    this.destroyed = true;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.stateListeners.clear();
    this.contentDeltaListeners.clear();
    this.contentSetListeners.clear();
    this.resyncListeners.clear();
  }

  getState(): OtClientState {
    return {
      revision: this.revision,
      status: this.status,
      errorMessage: this.errorMessage,
      hasPending: this.inFlight !== null || this.buffered.ops.length > 0,
    };
  }

  setSnapshot(snapshot: DocumentSnapshot): void {
    this.committed = new Delta(snapshot.content.ops);
    this.revision = snapshot.revision;
    this.inFlight = null;
    this.buffered = new Delta();
    this.status = 'idle';
    this.errorMessage = null;
    this.emitContentSet(this.committed);
    this.emitState();
  }

  apply(rawDelta: Delta | DocumentContentJson): void {
    const localDelta = rawDelta instanceof Delta ? rawDelta : new Delta(rawDelta.ops);
    if (localDelta.ops.length === 0) {
      return;
    }

    if (this.inFlight === null) {
      this.inFlight = localDelta;
      this.inFlightBaseRev = this.revision;
      void this.send();
    } else {
      this.buffered = this.buffered.compose(localDelta);
    }
    this.emitState();
  }

  suspend(): void {
    if (this.suspended) {
      return;
    }
    this.suspended = true;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.status = 'syncing';
    this.errorMessage = null;
    this.emitState();
  }

  resume(): void {
    if (!this.suspended) {
      return;
    }
    this.suspended = false;
    this.retryDelayMs = otBackoff.baseDelayMs;
    if (this.inFlight !== null) {
      this.inFlightBaseRev = this.revision;
      void this.send();
    } else {
      this.status = 'idle';
      this.errorMessage = null;
      this.emitState();
    }
  }

  async resync(): Promise<void> {
    await this.catchup();
    if (this.destroyed || this.status === 'error') {
      return;
    }
    this.resume();
  }

  onRemote(broadcast: DocumentOperationBroadcast): void {
    const remote = new Delta(broadcast.delta.ops);
    this.applyRemote(remote, broadcast.revision);
  }

  async catchup(): Promise<void> {
    this.status = 'syncing';
    this.emitState();
    const result = await this.options.requestCatchup(this.revision);
    if (this.destroyed) {
      return;
    }
    if (!result.ok) {
      this.status = 'error';
      this.errorMessage = result.error ?? 'Catchup failed';
      this.emitState();
      return;
    }

    if (result.action === 'full-resync') {
      this.resetToSnapshot({
        revision: result.currentRevision,
        content: result.content,
      });
      return;
    }

    result.ops.forEach((op) => {
      if (op.revision <= this.revision) {
        return;
      }
      this.applyRemote(new Delta(op.delta.ops), op.revision);
    });
    this.revision = Math.max(this.revision, result.currentRevision);
    this.status = this.inFlight ? 'sending' : 'idle';
    this.errorMessage = null;
    this.emitState();
  }

  private resetToSnapshot(snapshot: DocumentSnapshot): void {
    const droppedPending = this.inFlight !== null || this.buffered.ops.length > 0;
    this.committed = new Delta(snapshot.content.ops);
    this.revision = snapshot.revision;
    this.inFlight = null;
    this.buffered = new Delta();
    this.status = 'idle';
    this.errorMessage = null;
    this.emitContentSet(this.committed);
    this.emitResync({ droppedPending });
    this.emitState();
  }

  onStateChange(handler: OtListener): () => void {
    this.stateListeners.add(handler);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  onContentDelta(handler: OtContentDeltaListener): () => void {
    this.contentDeltaListeners.add(handler);
    return () => {
      this.contentDeltaListeners.delete(handler);
    };
  }

  onContentSet(handler: OtContentSetListener): () => void {
    this.contentSetListeners.add(handler);
    return () => {
      this.contentSetListeners.delete(handler);
    };
  }

  onResync(handler: OtResyncListener): () => void {
    this.resyncListeners.add(handler);
    return () => {
      this.resyncListeners.delete(handler);
    };
  }

  private applyRemote(remote: Delta, remoteRevision: number): void {
    if (remote.ops.length === 0) {
      return;
    }
    if (remoteRevision <= this.revision) {
      return;
    }

    const localStack = (this.inFlight ?? new Delta()).compose(this.buffered);
    const editorDiff = localStack.transform(remote, false);

    this.committed = this.committed.compose(remote);
    this.revision = remoteRevision;

    if (this.inFlight !== null) {
      const oldInFlight = this.inFlight;
      const oldBuffered = this.buffered;
      const newInFlight = remote.transform(oldInFlight, true);
      const shiftedRemote = oldInFlight.transform(remote, false);
      const newBuffered = shiftedRemote.transform(oldBuffered, true);
      this.inFlight = newInFlight;
      this.buffered = newBuffered;
    } else {
      this.buffered = remote.transform(this.buffered, true);
    }

    if (editorDiff.ops.length > 0) {
      this.emitContentDelta(editorDiff);
    }
    this.emitState();
  }

  private async send(): Promise<void> {
    if (this.destroyed || this.suspended || this.inFlight === null) {
      return;
    }
    if (this.sending) {
      return;
    }
    this.sending = true;
    try {
      while (this.inFlight !== null && !this.destroyed && !this.suspended) {
        this.status = 'sending';
        this.errorMessage = null;
        this.emitState();

        const sentDelta = this.inFlight;
        const sentBaseRev = this.inFlightBaseRev;

        let result: OtSendResult;
        try {
          result = await this.options.send({
            baseRevision: sentBaseRev,
            delta: { ops: sentDelta.ops as DocumentContentJson['ops'] },
          });
        } catch (error) {
          if (this.destroyed || this.suspended) {
            return;
          }
          const message = error instanceof Error ? error.message : 'Send failed';
          this.scheduleRetry(message);
          return;
        }

        if (this.destroyed || this.suspended) {
          return;
        }

        if (!result.ok) {
          const message = result.error ?? 'Operation rejected';
          if (RATE_LIMITED_RE.test(message)) {
            this.scheduleRetry(message);
            return;
          }
          this.revertPending();
          this.status = 'error';
          this.errorMessage = message;
          this.emitState();
          return;
        }

        this.retryDelayMs = otBackoff.baseDelayMs;

        if (result.transformedDelta && typeof result.revision === 'number') {
          const transformed = new Delta(result.transformedDelta.ops);
          this.committed = this.committed.compose(transformed);
          this.revision = result.revision;
        }
        this.inFlight = null;

        if (this.buffered.ops.length > 0) {
          this.inFlight = this.buffered;
          this.buffered = new Delta();
          this.inFlightBaseRev = this.revision;
          continue;
        }

        this.status = 'idle';
        this.errorMessage = null;
        this.emitState();
      }
    } finally {
      this.sending = false;
    }
  }

  private revertPending(): void {
    const pending = (this.inFlight ?? new Delta()).compose(this.buffered);
    this.inFlight = null;
    this.buffered = new Delta();
    if (pending.ops.length === 0) {
      return;
    }
    const undo = pending.invert(this.committed);
    if (undo.ops.length > 0) {
      this.emitContentDelta(undo);
    }
  }

  private scheduleRetry(reason: string): void {
    this.status = 'syncing';
    this.errorMessage = reason;
    this.emitState();

    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
    }
    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(this.retryDelayMs * 2, otBackoff.maxDelayMs);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.send();
    }, delay);
  }

  private emitState(): void {
    const snapshot = this.getState();
    this.stateListeners.forEach((listener) => listener(snapshot));
  }

  private emitContentDelta(delta: Delta): void {
    this.contentDeltaListeners.forEach((listener) => listener(delta));
  }

  private emitContentSet(content: Delta): void {
    this.contentSetListeners.forEach((listener) => listener(content));
  }

  private emitResync(info: { droppedPending: boolean }): void {
    this.resyncListeners.forEach((listener) => listener(info));
  }
}