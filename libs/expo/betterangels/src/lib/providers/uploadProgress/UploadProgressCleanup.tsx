import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import {
  endUploadSession,
  uploadSessionsAtom,
  uploadStageVisibleAtom,
} from './uploadProgressAtoms';
import { uploadSessionCounts } from './uploadProgressUtils';

const COMPLETE_CLEANUP_DELAY_MS = 3000;

/**
 * Root-mounted housekeeping: completed sessions are not rendered anywhere
 * (the refetched query shows the real rows), so they are dropped shortly
 * after finishing to keep the store from growing unboundedly. Failed
 * sessions persist — their retry affordance stays visible.
 *
 * Completed sessions are kept while the upload stage is open: the stage
 * shows their final rows and closes only when the user dismisses it, so
 * pruning them from under it would empty (and auto-close) the screen.
 *
 * Mounted once at the app root; there is no per-screen provider anymore.
 */
export function UploadProgressCleanup() {
  const sessions = useAtomValue(uploadSessionsAtom);
  const uploadStageVisible = useAtomValue(uploadStageVisibleAtom);
  const cleanupTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    if (uploadStageVisible) {
      // The stage shows completed rows; keep them until it closes. Clear
      // any timers that were scheduled before it opened so they can't prune
      // sessions out from under it.
      cleanupTimers.current.forEach((timer) => clearTimeout(timer));
      cleanupTimers.current.clear();
      return;
    }

    for (const session of sessions) {
      const { complete } = uploadSessionCounts(session);

      if (!complete || cleanupTimers.current.has(session.id)) {
        continue;
      }

      cleanupTimers.current.set(
        session.id,
        setTimeout(() => {
          // Prune the entry when it fires so the map stays bounded even in a
          // long-lived app session.
          cleanupTimers.current.delete(session.id);
          endUploadSession(session.id);
        }, COMPLETE_CLEANUP_DELAY_MS),
      );
    }

    // Prune timers for sessions that ended before their timeout fired.
    const sessionIds = new Set(sessions.map((session) => session.id));
    for (const [id, timer] of cleanupTimers.current) {
      if (!sessionIds.has(id)) {
        clearTimeout(timer);
        cleanupTimers.current.delete(id);
      }
    }
  }, [sessions, uploadStageVisible]);

  // Clear pending timers when the provider tree unmounts.
  useEffect(() => {
    const timers = cleanupTimers.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return null;
}
