import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TUploadItemStatus } from './uploadProgressTypes';

const STORAGE_KEY = 'betterangels.uploadManifests.v1';

/**
 * Presigned POSTs expire server-side (S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS,
 * currently 300s) and the signed upload token carries a 180s grace on top.
 * Past that window neither the upload nor the save can use what we stored, so
 * a resumed file has to go through a fresh generate → upload → save cycle.
 *
 * Kept deliberately below the server's 300s so we never present credentials
 * that expire mid-request.
 */
export const PRESIGN_REUSE_WINDOW_MS = 240_000;

/**
 * How long a manifest is worth keeping at all. Beyond this the local file
 * has usually been purged from the OS cache anyway, and silently re-uploading
 * something the user picked days ago would be surprising.
 */
export const MANIFEST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type TPersistedUploadItem = {
  refId: string;
  name: string;
  /** Local file uri, needed to re-upload after the presigned POST expires. */
  uri: string;
  mimeType: string;
  status: TUploadItemStatus;
  /** Set once the bytes reach S3, so a resume can skip straight to saving. */
  presignedKey?: string;
  uploadToken?: string;
};

/**
 * Everything needed to finish a client-document upload from a cold start:
 * which client, which namespace, which files, and how far each one got.
 */
export type TPersistedUploadSession = {
  id: string;
  clientProfileId: string;
  namespace: string;
  label?: string;
  items: TPersistedUploadItem[];
  /** Epoch ms, used for both presign-reuse and staleness decisions. */
  createdAt: number;
};

async function readAll(): Promise<TPersistedUploadSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as TPersistedUploadSession[]) : [];
  } catch {
    // A corrupt or unreadable manifest must never block app start; the cost
    // is a lost resume, not a broken launch.
    return [];
  }
}

async function writeAll(sessions: TPersistedUploadSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Persistence is a recovery aid; failing to write it should not fail
    // the upload that is currently running fine.
  }
}

export async function saveUploadManifest(
  session: TPersistedUploadSession,
): Promise<void> {
  const sessions = await readAll();
  const index = sessions.findIndex((entry) => entry.id === session.id);

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }

  await writeAll(sessions);
}

/** Applies a partial update to one session's items, if it is still stored. */
export async function updateUploadManifestItems(
  sessionId: string,
  update: (items: TPersistedUploadItem[]) => TPersistedUploadItem[],
): Promise<void> {
  const sessions = await readAll();
  const index = sessions.findIndex((entry) => entry.id === sessionId);

  if (index < 0) {
    return;
  }

  sessions[index] = {
    ...sessions[index],
    items: update(sessions[index].items),
  };
  await writeAll(sessions);
}

export async function deleteUploadManifest(sessionId: string): Promise<void> {
  const sessions = await readAll();
  await writeAll(sessions.filter((entry) => entry.id !== sessionId));
}

/**
 * Manifests worth resuming: anything with unfinished items that has not aged
 * out. Expired records are dropped as a side effect so the store does not
 * accumulate them.
 */
export async function loadResumableManifests(
  now: number,
): Promise<TPersistedUploadSession[]> {
  const sessions = await readAll();

  const fresh = sessions.filter(
    (session) => now - session.createdAt < MANIFEST_MAX_AGE_MS,
  );
  const resumable = fresh.filter((session) =>
    session.items.some((item) => item.status !== 'done'),
  );

  if (fresh.length !== sessions.length) {
    await writeAll(fresh);
  }

  return resumable;
}

/**
 * True when a persisted item's presigned credentials are still usable, so a
 * resume can save it without re-uploading the bytes. This is the crash
 * window that matters most: the app died between S3 accepting the file and
 * the save step recording it.
 */
export function canReusePresign(
  session: TPersistedUploadSession,
  item: TPersistedUploadItem,
  now: number,
): boolean {
  return (
    item.status === 'uploaded' &&
    !!item.presignedKey &&
    !!item.uploadToken &&
    now - session.createdAt < PRESIGN_REUSE_WINDOW_MS
  );
}

/** Test-only: clears everything this module has stored. */
export async function resetUploadManifests(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
