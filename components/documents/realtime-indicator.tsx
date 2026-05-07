'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import type { ConnectionStatus } from '@/lib/realtime';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  errorMessage: string | null;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting',
  connected: 'Live',
  reconnecting: 'Reconnecting',
  error: 'Disconnected',
};

const DOT_COLORS: Record<ConnectionStatus, string> = {
  idle: 'bg-muted-foreground',
  connecting: 'bg-amber-500',
  connected: 'bg-emerald-500',
  reconnecting: 'bg-amber-500',
  error: 'bg-destructive',
};

export function RealtimeIndicator({
  status,
  errorMessage,
}: RealtimeIndicatorProps): React.JSX.Element {
  const showSpinner = status === 'connecting' || status === 'reconnecting';

  return (
    <Badge
      variant="outline"
      className="gap-1.5"
      title={errorMessage ?? undefined}
    >
      {showSpinner ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <span
          className={cn(
            'inline-block size-2 rounded-full',
            DOT_COLORS[status],
            status === 'connected' && 'animate-pulse',
          )}
        />
      )}
      {STATUS_LABELS[status]}
    </Badge>
  );
}