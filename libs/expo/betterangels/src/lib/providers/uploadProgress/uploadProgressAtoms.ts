import { atom, getDefaultStore } from 'jotai';
import type { TUploadProgress } from '@monorepo/expo/shared/services';
import {
  TUploadItemStatus,
  TUploadManifestEntry,
  TUploadSession,
  TStartUploadOptions,
} from './uploadProgressTypes';

/**
 * Module-scoped upload session state (Jotai convention — cf.
 * `userPreferencesState`, `clientInteractionsMapState`). In-flight sessions
 * survive any screen unmounting, so uploads keep running in the background
 * and any surface (upload screen, global progress bar) can render them.
 * No provider is required: the default Jotai store is shared module-wide.
 */

const defaultStore = getDefaultStore();

export const uploadSessionsAtom = atom<TUploadSession[]>([]);

/**
 * True while the upload-stage screen is open. The global progress bar hides
 * itself then — per-file progress is already on screen.
 */
export const uploadStageVisibleAtom = atom<boolean>(false);

function getSessions(): TUploadSession[] {
  return defaultStore.get(uploadSessionsAtom);
}

function commit(next: TUploadSession[]) {
  defaultStore.set(uploadSessionsAtom, next);
}

export function startUploadSession(
  id: string,
  names: string[],
  options?: TStartUploadOptions,
) {
  const { onCancelItem, label, onRetryItem, clientId, groupId, files } =
    options ?? {};

  // Uploads accumulate until dismissed so several can be in flight at once.
  commit([
    ...getSessions(),
    {
      id,
      stage: 'GENERATING',
      items: names.map((name, index) => ({
        refId: `pending-${index}`,
        name,
        uri: files?.[index]?.uri,
        mimeType: files?.[index]?.type,
        status: 'pending' as TUploadItemStatus,
        onCancel: onCancelItem ? () => onCancelItem(index) : undefined,
        onRetry: onRetryItem ? () => onRetryItem(index) : undefined,
      })),
      completed: 0,
      total: names.length,
      failed: false,
      label,
      clientId,
      groupId,
    },
  ]);
}

export function setUploadManifestSession(
  id: string,
  manifest: TUploadManifestEntry[],
) {
  commit(
    getSessions().map((session) => {
      if (session.id !== id) {
        return session;
      }

      return {
        ...session,
        items: manifest.map((entry, index) => ({
          refId: entry.refId,
          name: session.items[index]?.name ?? entry.file.name,
          uri: session.items[index]?.uri,
          mimeType: session.items[index]?.mimeType,
          status: session.items[index]?.status ?? 'pending',
          onCancel: session.items[index]?.onCancel,
          onRetry: session.items[index]?.onRetry,
        })),
      };
    }),
  );
}

export function updateUploadSession(id: string, progress: TUploadProgress) {
  commit(
    getSessions().map((session) => {
      if (session.id !== id) {
        return session;
      }

      const items = progress.refId
        ? session.items.map((item) =>
            item.refId === progress.refId
              ? {
                  ...item,
                  status: toItemStatus(progress.status),
                  ...(typeof progress.bytesSent === 'number' &&
                  typeof progress.totalBytes === 'number'
                    ? {
                        bytesSent: progress.bytesSent,
                        totalBytes: progress.totalBytes,
                      }
                    : {}),
                }
              : item,
          )
        : session.items;

      return {
        ...session,
        stage: progress.stage,
        // total stays authoritative in the store (per-item cancels shrink it).
        completed: Math.min(progress.completed, session.total),
        items,
        failed: session.failed || progress.status === 'error',
      };
    }),
  );
}

export function failUploadSession(id: string, errorMessage?: string) {
  commit(
    getSessions().map((session) =>
      session.id !== id
        ? session
        : {
            ...session,
            failed: true,
            errorMessage,
            // Only 'done' items were persisted; anything still 'uploaded'
            // reached S3 but was never saved, so it is a failure the user
            // needs to retry rather than a success.
            items: session.items.map((item) =>
              item.status === 'done'
                ? item
                : { ...item, status: 'error' as TUploadItemStatus },
            ),
          },
    ),
  );
}

/**
 * Marks a session's save step as finished: every item that is not in error
 * becomes `done` (persisted). Items that already failed stay failed, so a
 * partially-successful batch settles as "some saved, some retryable"
 * rather than reporting blanket success.
 */
export function completeUploadSession(id: string) {
  commit(
    getSessions().map((session) => {
      if (session.id !== id) {
        return session;
      }

      const items = session.items.map((item) =>
        item.status === 'error'
          ? item
          : { ...item, status: 'done' as TUploadItemStatus },
      );
      const complete = items.every((item) => item.status === 'done');

      return {
        ...session,
        items,
        complete,
        completed: items.filter((item) => item.status === 'done').length,
      };
    }),
  );
}

/**
 * Flags a session whose save step succeeded for some files but not all.
 * Unlike `failUploadSession` this leaves item statuses alone — the files
 * that were persisted stay `done`, and only the already-failed ones carry a
 * retry affordance.
 */
export function markUploadPartiallyFailed(id: string, errorMessage?: string) {
  commit(
    getSessions().map((session) =>
      session.id !== id
        ? session
        : { ...session, failed: true, complete: false, errorMessage },
    ),
  );
}

/** Reads a session directly (for callers outside React, e.g. upload runners). */
export function getUploadSession(id: string): TUploadSession | undefined {
  return getSessions().find((session) => session.id === id);
}

export function endUploadSession(id: string) {
  commit(getSessions().filter((session) => session.id !== id));
}

export function retryUploadItemSession(sessionId: string, refId: string) {
  const session = getSessions().find((s) => s.id === sessionId);
  const item = session?.items.find((i) => i.refId === refId);

  if (!session || !item) {
    return;
  }

  // Start the replacement session first so it surfaces as the latest session
  // (sessions are appended, and consumers show the last).
  item.onRetry?.();

  const items = session.items.filter((i) => i.refId !== refId);

  if (!items.length) {
    // The retried file was the only item → nothing left in this session.
    commit(getSessions().filter((s) => s.id !== sessionId));
    return;
  }

  commit(
    getSessions().map((s) =>
      s.id !== sessionId
        ? s
        : {
            ...s,
            items,
            total: s.total - 1,
            completed: item.status === 'done' ? s.completed - 1 : s.completed,
          },
    ),
  );
}

export function cancelUploadItemSession(sessionId: string, refId: string) {
  const session = getSessions().find((s) => s.id === sessionId);
  const item = session?.items.find((i) => i.refId === refId);

  if (!session || !item) {
    return;
  }

  item.onCancel?.();

  const items = session.items.filter((i) => i.refId !== refId);

  if (!items.length) {
    // Last item cancelled → nothing left to show; remove the whole session.
    commit(getSessions().filter((s) => s.id !== sessionId));
    return;
  }

  commit(
    getSessions().map((s) =>
      s.id !== sessionId
        ? s
        : {
            ...s,
            items,
            total: s.total - 1,
            completed: item.status === 'done' ? s.completed - 1 : s.completed,
          },
    ),
  );
}

export function setUploadStageVisible(visible: boolean) {
  defaultStore.set(uploadStageVisibleAtom, visible);
}

/** Test-only: resets module state between test cases. */
export function resetUploadProgressAtoms() {
  defaultStore.set(uploadSessionsAtom, []);
  defaultStore.set(uploadStageVisibleAtom, false);
}

function toItemStatus(status: TUploadProgress['status']): TUploadItemStatus {
  switch (status) {
    // The pipeline's 'done' means "bytes reached S3", not "persisted". Only
    // `completeUploadSession` (called after the save step) promotes an item
    // to 'done', so a batch that fails before saving never shows green rows
    // for files that were not actually recorded.
    case 'done':
      return 'uploaded';
    case 'error':
      return 'error';
    case 'uploading':
      return 'uploading';
    default:
      return 'pending';
  }
}
