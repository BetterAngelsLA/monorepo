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

type TUploadState = {
  sessions: TUploadSession[];
  /** True while an upload queue (e.g. the upload modal) is showing progress. */
  queueOpen: boolean;
};

let state: TUploadState = { sessions: [], queueOpen: false };
const cancelHandlers = new Map<string, () => void>();
const listeners = new Set<() => void>();

function commit(next: TUploadState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeUploadStore(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getUploadSnapshot(): TUploadState {
  return state;
}

export function setQueueOpenSession(open: boolean) {
  commit({ sessions: state.sessions, queueOpen: open });
}

export function startUploadSession(
  id: string,
  names: string[],
  onCancel?: () => void,
  label?: string,
) {
  // Uploads can be queued in a batch, so sessions accumulate until they are
  // dismissed instead of superseding each other.
  if (onCancel) {
    cancelHandlers.set(id, onCancel);
  }

  commit({
    sessions: [
      ...state.sessions,
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
        label,
        onCancel,
      },
    ],
    queueOpen: state.queueOpen,
  });
}

export function setUploadManifestSession(
  id: string,
  manifest: TUploadManifestEntry[],
) {
  commit({
    sessions: state.sessions.map((session) => {
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
    queueOpen: state.queueOpen,
  });
}

export function updateUploadSession(id: string, progress: TUploadProgress) {
  commit({
    sessions: state.sessions.map((session) => {
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
    queueOpen: state.queueOpen,
  });
}

export function failUploadSession(id: string, errorMessage?: string) {
  commit({
    sessions: state.sessions.map((session) =>
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
    queueOpen: state.queueOpen,
  });
}

export function completeUploadSession(id: string) {
  commit({
    sessions: state.sessions.map((session) =>
      session.id !== id
        ? session
        : { ...session, complete: true, completed: session.total },
    ),
    queueOpen: state.queueOpen,
  });
}

export function endUploadSession(id: string) {
  cancelHandlers.delete(id);
  commit({
    sessions: state.sessions.filter((session) => session.id !== id),
    queueOpen: state.queueOpen,
  });
}

export function cancelUploadSession(id: string) {
  cancelHandlers.get(id)?.();
  cancelHandlers.delete(id);
  commit({
    sessions: state.sessions.filter((session) => session.id !== id),
    queueOpen: state.queueOpen,
  });
}

/** Test-only: resets module state between test cases. */
export function resetUploadProgressStore() {
  state = { sessions: [], queueOpen: false };
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
