'use client';

import * as React from 'react';

import type { PresenceParticipant } from '@/lib/realtime';
import { getInitials } from '@/lib/shared';

interface PresenceRosterProps {
  participants: PresenceParticipant[];
}

const MAX_VISIBLE = 5;

interface PresenceAvatarProps {
  entry: PresenceParticipant;
}

function PresenceAvatar({ entry }: PresenceAvatarProps): React.JSX.Element {
  return (
    <span className="group relative inline-flex">
      <span
        className="border-background inline-flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold text-white"
        style={{ backgroundColor: entry.color }}
      >
        {getInitials(entry.displayName)}
      </span>
      <span className="bg-foreground text-background pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 hidden -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap group-hover:block">
        {entry.displayName}
      </span>
    </span>
  );
}

export function PresenceRoster({
  participants,
}: PresenceRosterProps): React.JSX.Element | null {
  const unique = React.useMemo(() => {
    const byUser = new Map<number, PresenceParticipant>();
    participants.forEach((entry) => {
      if (!byUser.has(entry.userId)) {
        byUser.set(entry.userId, entry);
      }
    });
    return Array.from(byUser.values());
  }, [participants]);

  if (unique.length === 0) {
    return null;
  }

  const visible = unique.slice(0, MAX_VISIBLE);
  const overflow = unique.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((entry) => (
        <PresenceAvatar key={entry.userId} entry={entry} />
      ))}
      {overflow > 0 ? (
        <span className="border-background bg-muted text-muted-foreground inline-flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}