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
  const { onCancelItem, label, onRetryItem, clientId, groupId } = options ?? {};

  // Uploads accumulate until dismissed so several can be in flight at once.
  commit([
    ...getSessions(),
    {
      id,
      stage: 'GENERATING',
      items: names.map((name, index) => ({
        refId: `pending-${index}`,
        name,
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
            items: session.items.map((item) =>
              item.status === 'done'
                ? item
                : { ...item, status: 'error' as TUploadItemStatus },
            ),
          },
    ),
  );
}

export function completeUploadSession(id: string) {
  commit(
    getSessions().map((session) =>
      session.id !== id
        ? session
        : { ...session, complete: true, completed: session.total },
    ),
  );
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
    case 'done':
      return 'done';
    case 'error':
      return 'error';
    case 'uploading':
      return 'uploading';
    default:
      return 'pending';
  }
}
