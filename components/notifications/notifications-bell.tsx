'use client';

import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { DOCUMENT_ROLE_LABELS, DocumentRole } from '@/lib/documents';
import {
  type Notification,
  NotificationType,
  useNotificationsStore,
} from '@/lib/notifications';
import { realtimeClient } from '@/lib/realtime';
import { APP_ROUTES, formatShortDate } from '@/lib/shared';
import { cn } from '@/lib/utils';

function roleLabel(role: DocumentRole | null | undefined): string {
  if (role === null || role === undefined) {
    return 'access';
  }
  return DOCUMENT_ROLE_LABELS[role].toLowerCase();
}

export function NotificationsBell(): React.JSX.Element {
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const fetch = useNotificationsStore((state) => state.fetch);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const remove = useNotificationsStore((state) => state.remove);
  const removeAll = useNotificationsStore((state) => state.removeAll);
  const pushNew = useNotificationsStore((state) => state.pushNew);

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    void fetch();
    const unsubscribe = realtimeClient.onNotificationNew((notification) => {
      pushNew(notification);
    });
    return unsubscribe;
  }, [fetch, pushNew]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const renderMessage = (notification: Notification): React.ReactNode => {
    const { documentId, documentTitle, role } = notification.payload;

    const titleLink = (
      <Link
        href={`${APP_ROUTES.DOCUMENTS}/${documentId}`}
        onClick={() => {
          void markRead(notification.id);
          setIsOpen(false);
        }}
        className="text-primary font-medium hover:underline"
      >
        &ldquo;{documentTitle}&rdquo;
      </Link>
    );
    const titlePlain = <span className="text-foreground font-medium">&ldquo;{documentTitle}&rdquo;</span>;

    switch (notification.type) {
      case NotificationType.ACCESS_GRANTED:
        return <>You were given {roleLabel(role)} access to {titleLink}</>;
      case NotificationType.ROLE_CHANGED:
        return <>Your role on {titleLink} is now {roleLabel(role)}</>;
      case NotificationType.ACCESS_REVOKED:
        return <>You no longer have access to {titlePlain}</>;
      default:
        return <>Update on {titlePlain}</>;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="border-border bg-popover absolute right-0 z-40 mt-2 w-96 origin-top-right overflow-hidden rounded-lg border shadow-lg">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <span className="text-foreground text-sm font-semibold">Notifications</span>
            {items.length > 0 ? (
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="bg-secondary text-secondary-foreground hover:bg-primary/15 hover:text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void removeAll()}
                  className="bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Clear all
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                No notifications yet
              </p>
            ) : (
              items.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => void markRead(notification.id)}
                  className={cn(
                    'group border-border/60 hover:bg-muted/40 flex cursor-pointer items-start gap-3 border-b px-4 py-3 last:border-b-0 transition-colors',
                    notification.readAt ? 'opacity-70' : 'bg-primary/[0.04]',
                  )}
                >
                  {!notification.readAt ? (
                    <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                  ) : (
                    <span className="mt-1.5 size-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm leading-snug">
                      {renderMessage(notification)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatShortDate(notification.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={(event) => {
                      event.stopPropagation();
                      void remove(notification.id);
                    }}
                    className="text-muted-foreground hover:text-foreground opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}