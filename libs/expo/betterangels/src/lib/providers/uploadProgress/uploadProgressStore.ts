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
};

let state: TUploadState = { sessions: [] };
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

export function startUploadSession(
  id: string,
  names: string[],
  onCancelItem?: (index: number) => void,
  label?: string,
  onRetryItem?: (index: number) => void,
) {
  // Uploads accumulate until dismissed so several can be in flight at once.
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
          onCancel: onCancelItem ? () => onCancelItem(index) : undefined,
          onRetry: onRetryItem ? () => onRetryItem(index) : undefined,
        })),
        completed: 0,
        total: names.length,
        failed: false,
        label,
      },
    ],
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
          onCancel: session.items[index]?.onCancel,
          onRetry: session.items[index]?.onRetry,
        })),
      };
    }),
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
        // total stays authoritative in the store (per-item cancels shrink it).
        completed: Math.min(progress.completed, session.total),
        items,
        failed: session.failed || progress.status === 'error',
      };
    }),
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
  });
}

export function completeUploadSession(id: string) {
  commit({
    sessions: state.sessions.map((session) =>
      session.id !== id
        ? session
        : { ...session, complete: true, completed: session.total },
    ),
  });
}

export function endUploadSession(id: string) {
  commit({
    sessions: state.sessions.filter((session) => session.id !== id),
  });
}

export function retryUploadItemSession(sessionId: string, refId: string) {
  const session = state.sessions.find((s) => s.id === sessionId);
  const item = session?.items.find((i) => i.refId === refId);

  if (!session || !item) {
    return;
  }

  // Start the replacement session first so the drawer surfaces it as the
  // latest session (sessions are appended, and the drawer shows the last).
  item.onRetry?.();

  const items = session.items.filter((i) => i.refId !== refId);

  if (!items.length) {
    // The retried file was the only item → nothing left in this session.
    commit({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    });
    return;
  }

  commit({
    sessions: state.sessions.map((s) =>
      s.id !== sessionId
        ? s
        : {
            ...s,
            items,
            total: s.total - 1,
            completed:
              item.status === 'done' ? s.completed - 1 : s.completed,
          },
    ),
  });
}

export function cancelUploadItemSession(sessionId: string, refId: string) {
  const session = state.sessions.find((s) => s.id === sessionId);
  const item = session?.items.find((i) => i.refId === refId);

  if (!session || !item) {
    return;
  }

  item.onCancel?.();

  const items = session.items.filter((i) => i.refId !== refId);

  if (!items.length) {
    // Last item cancelled → nothing left to show; remove the whole session.
    commit({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    });
    return;
  }

  commit({
    sessions: state.sessions.map((s) =>
      s.id !== sessionId
        ? s
        : {
            ...s,
            items,
            total: s.total - 1,
            completed:
              item.status === 'done' ? s.completed - 1 : s.completed,
          },
    ),
  });
}

/** Test-only: resets module state between test cases. */
export function resetUploadProgressStore() {
  state = { sessions: [] };
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
