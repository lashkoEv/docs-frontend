'use client';

import * as React from 'react';

import { realtimeClient } from './realtime.client';
import type { PresenceParticipant } from './realtime.types';

export function usePresence(documentId: number | null): PresenceParticipant[] {
  const [participants, setParticipants] = React.useState<PresenceParticipant[]>([]);

  React.useEffect(() => {
    if (documentId === null) {
      return;
    }
    setParticipants([]);

    const unsubscribeState = realtimeClient.onPresenceState((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      setParticipants(event.participants);
    });

    const unsubscribeJoined = realtimeClient.onPresenceJoined((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      setParticipants((prev) =>
        prev.some((entry) => entry.socketId === event.participant.socketId)
          ? prev
          : [...prev, event.participant],
      );
    });

    const unsubscribeLeft = realtimeClient.onPresenceLeft((event) => {
      if (event.documentId !== documentId) {
        return;
      }
      setParticipants((prev) =>
        prev.filter((entry) => entry.socketId !== event.socketId),
      );
    });

    return () => {
      unsubscribeState();
      unsubscribeJoined();
      unsubscribeLeft();
      setParticipants([]);
    };
  }, [documentId]);

  return participants;
}