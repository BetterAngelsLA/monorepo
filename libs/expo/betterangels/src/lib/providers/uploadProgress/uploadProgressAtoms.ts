import { atom, getDefaultStore } from 'jotai';
import type { TUploadProgress } from '@monorepo/expo/shared/services';
import {
  getUploadRunner,
  resetUploadRunners,
  setRunnerItemRefIds,
  unregisterUploadRunner,
} from './uploadRunnerRegistry';
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
  const { label, clientId, refIds, files, cancellable, retryable } =
    options ?? {};

  const items = names.map((name, index) => ({
    refId: refIds?.[index] ?? `pending-${index}`,
    name,
    uri: files?.[index]?.uri,
    mimeType: files?.[index]?.type,
    status: 'pending' as TUploadItemStatus,
  }));

  setRunnerItemRefIds(
    id,
    items.map((item) => item.refId),
  );

  // Uploads accumulate until dismissed so several can be in flight at once.
  commit([
    ...getSessions(),
    { id, stage: 'GENERATING', items, label, clientId, cancellable, retryable },
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

      // Counts come from `items` via `uploadSessionCounts`, so the pipeline's
      // own completed/total are ignored here — they describe the transport
      // run, which no longer matches the session once items are cancelled.
      return { ...session, stage: progress.stage, items };
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
    getSessions().map((session) =>
      session.id !== id
        ? session
        : {
            ...session,
            items: session.items.map((item) =>
              item.status === 'error'
                ? item
                : { ...item, status: 'done' as TUploadItemStatus },
            ),
          },
    ),
  );
}

/**
 * Attaches the failure detail for a session whose save step succeeded for
 * some files but not all. Item statuses are left alone — the persisted
 * files stay `done` and only the already-failed ones carry a retry
 * affordance — and `failed`/`complete` derive from those statuses.
 */
export function markUploadPartiallyFailed(id: string, errorMessage?: string) {
  commit(
    getSessions().map((session) =>
      session.id !== id ? session : { ...session, errorMessage },
    ),
  );
}

/** Reads a session directly (for callers outside React, e.g. upload runners). */
export function getUploadSession(id: string): TUploadSession | undefined {
  return getSessions().find((session) => session.id === id);
}

export function endUploadSession(id: string) {
  // The runner outlives the React component that made it, so nothing else
  // would ever drop it.
  unregisterUploadRunner(id);
  commit(getSessions().filter((session) => session.id !== id));
}

/**
 * Retries failed items in place. The items go back to `pending` and the
 * session re-runs them against their existing refIds, so one user action
 * stays one session however many retries it takes — and retrying several
 * files at once costs one transport run, not one per file.
 */
export function retryUploadItemsSession(sessionId: string, refIds: string[]) {
  const session = getSessions().find((s) => s.id === sessionId);

  if (!session) {
    return;
  }

  const retrying = new Set(
    session.items
      .filter((item) => refIds.includes(item.refId) && item.status === 'error')
      .map((item) => item.refId),
  );

  if (!retrying.size) {
    return;
  }

  commit(
    getSessions().map((s) =>
      s.id !== sessionId
        ? s
        : {
            ...s,
            stage: 'GENERATING',
            // The previous run's message no longer describes this attempt.
            errorMessage: undefined,
            items: s.items.map((item) =>
              retrying.has(item.refId)
                ? {
                    ...item,
                    status: 'pending' as TUploadItemStatus,
                    bytesSent: undefined,
                    totalBytes: undefined,
                  }
                : item,
            ),
          },
    ),
  );

  getUploadRunner(sessionId)?.rerun([...retrying]);
}

export function cancelUploadItemSession(sessionId: string, refId: string) {
  const session = getSessions().find((s) => s.id === sessionId);
  const item = session?.items.find((i) => i.refId === refId);

  if (!session || !item) {
    return;
  }

  getUploadRunner(sessionId)?.cancelItem(refId);

  const items = session.items.filter((i) => i.refId !== refId);

  if (!items.length) {
    // Last item cancelled → nothing left to show; remove the whole session.
    commit(getSessions().filter((s) => s.id !== sessionId));
    return;
  }

  commit(
    getSessions().map((s) => (s.id !== sessionId ? s : { ...s, items })),
  );
}

/**
 * Drops every failed item from a session, removing the session outright if
 * that empties it.
 *
 * Failed sessions are deliberately never auto-pruned — their retry
 * affordance has to survive navigation — so without an explicit dismissal a
 * file that keeps failing would pin the global progress bar in its error
 * state for the rest of the app session.
 */
export function dismissFailedUploadItemsSession(sessionId: string) {
  const session = getSessions().find((s) => s.id === sessionId);

  if (!session) {
    return;
  }

  const items = session.items.filter((item) => item.status !== 'error');

  if (!items.length) {
    commit(getSessions().filter((s) => s.id !== sessionId));
    return;
  }

  commit(
    getSessions().map((s) =>
      s.id !== sessionId ? s : { ...s, items, errorMessage: undefined },
    ),
  );
}

export function setUploadStageVisible(visible: boolean) {
  defaultStore.set(uploadStageVisibleAtom, visible);
}

/** Test-only: resets module state between test cases. */
export function resetUploadProgressAtoms() {
  resetUploadRunners();
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
