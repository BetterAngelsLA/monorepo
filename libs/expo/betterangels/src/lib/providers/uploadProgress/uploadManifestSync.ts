import { getDefaultStore } from 'jotai';
import {
  deleteUploadManifest,
  saveUploadManifest,
} from './uploadManifestStore';
import { uploadSessionsAtom } from './uploadProgressAtoms';
import type { TUploadSession } from './uploadProgressTypes';
import { uploadSessionCounts } from './uploadProgressUtils';

/**
 * Mirrors the session store to disk by *subscribing* to it, rather than
 * having the upload runner write to both.
 *
 * Two hand-maintained write paths for the same event is the shape that
 * produced every counter bug this module has had: one call site gets updated
 * and the other silently does not. Here the session is the only thing anyone
 * writes, and the persisted manifest is a projection of it.
 */

/** Only sessions that carry enough context to be re-run from a cold start. */
function isResumable(session: TUploadSession): boolean {
  return (
    !!session.namespace &&
    !!session.clientId &&
    typeof session.createdAt === 'number' &&
    session.items.some((item) => item.uri)
  );
}

export async function syncManifests(
  sessions: TUploadSession[],
  previousIds: Set<string>,
): Promise<Set<string>> {
  const currentIds = new Set<string>();

  for (const session of sessions) {
    if (!isResumable(session)) {
      continue;
    }

    currentIds.add(session.id);

    // Fully persisted work has nothing left to recover.
    if (uploadSessionCounts(session).complete) {
      await deleteUploadManifest(session.id);
      continue;
    }

    await saveUploadManifest({
      id: session.id,
      clientProfileId: session.clientId as string,
      namespace: session.namespace as string,
      label: session.label,
      createdAt: session.createdAt as number,
      items: session.items.map((item) => ({
        refId: item.refId,
        name: item.name,
        uri: item.uri as string,
        mimeType: item.mimeType ?? 'application/octet-stream',
        status: item.status,
        presignedKey: item.presignedKey,
        uploadToken: item.uploadToken,
      })),
    });
  }

  // Sessions that disappeared (cancelled, dismissed, pruned) leave nothing
  // to resume.
  for (const id of previousIds) {
    if (!currentIds.has(id)) {
      await deleteUploadManifest(id);
    }
  }

  return currentIds;
}

/**
 * Starts mirroring session state to disk. Returns an unsubscribe, and is
 * safe to call more than once.
 */
export function startUploadManifestSync(): () => void {
  const store = getDefaultStore();
  let tracked = new Set<string>();
  let queue: Promise<void> = Promise.resolve();

  const flush = () => {
    const sessions = store.get(uploadSessionsAtom);

    // Serialised: AsyncStorage writes are read-modify-write, so overlapping
    // flushes would lose updates.
    queue = queue
      .then(async () => {
        tracked = await syncManifests(sessions, tracked);
      })
      .catch(() => undefined);
  };

  flush();

  return store.sub(uploadSessionsAtom, flush);
}
