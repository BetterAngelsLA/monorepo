import type { TUploadProgress } from '@monorepo/expo/shared/services';
import {
  TUploadItemStatus,
  TUploadManifestEntry,
  TUploadSession,
} from './UploadProgressContext';

/**
 * Module-scoped upload session store shared by every UploadProgressProvider
 * instance (the app root and each modal screen). Keeping the state outside a
 * component means the progress drawer survives the provider that started an
 * upload unmounting — e.g. the UploadModal closing on success — so the
 * "Upload complete" state is visible after the modal is gone.
 */

let sessions: TUploadSession[] = [];
const cancelHandlers = new Map<string, () => void>();
const listeners = new Set<() => void>();

function commit(next: TUploadSession[]) {
  sessions = next;
  listeners.forEach((listener) => listener());
}

export function subscribeUploadStore(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getUploadSnapshot(): TUploadSession[] {
  return sessions;
}

export function startUploadSession(
  id: string,
  names: string[],
  onCancel?: () => void,
) {
  // Only the most recent upload is shown, so a new session supersedes any
  // previous (completed/failed) ones.
  cancelHandlers.clear();
  if (onCancel) {
    cancelHandlers.set(id, onCancel);
  }

  commit([
    {
      id,
      stage: 'GENERATING',
      items: names.map((name, index) => ({
        refId: `pending-${index}`,
        name,
        status: 'pending' as TUploadItemStatus,
      })),
      completed: 0,
      total: names.length,
      failed: false,
      onCancel,
    },
  ]);
}

export function setUploadManifestSession(
  id: string,
  manifest: TUploadManifestEntry[],
) {
  commit(
    sessions.map((session) => {
      if (session.id !== id) {
        return session;
      }

      return {
        ...session,
        items: manifest.map((entry, index) => ({
          refId: entry.refId,
          name: session.items[index]?.name ?? entry.file.name,
          status: session.items[index]?.status ?? 'pending',
        })),
      };
    }),
  );
}

export function updateUploadSession(id: string, progress: TUploadProgress) {
  commit(
    sessions.map((session) => {
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
        completed: progress.completed,
        total: progress.total,
        items,
        failed: session.failed || progress.status === 'error',
      };
    }),
  );
}

export function failUploadSession(id: string, errorMessage?: string) {
  commit(
    sessions.map((session) =>
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
    sessions.map((session) =>
      session.id !== id
        ? session
        : { ...session, complete: true, completed: session.total },
    ),
  );
}

export function endUploadSession(id: string) {
  cancelHandlers.delete(id);
  commit(sessions.filter((session) => session.id !== id));
}

export function cancelUploadSession(id: string) {
  cancelHandlers.get(id)?.();
  cancelHandlers.delete(id);
  commit(sessions.filter((session) => session.id !== id));
}

/** Test-only: resets module state between test cases. */
export function resetUploadProgressStore() {
  sessions = [];
  cancelHandlers.clear();
  listeners.clear();
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
