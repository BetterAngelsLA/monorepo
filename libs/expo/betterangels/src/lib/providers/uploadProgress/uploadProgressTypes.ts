import type { TUploadStage } from '@monorepo/expo/shared/services';
import type { TUploadItemRowStatus } from '@monorepo/expo/shared/ui-components';

/**
 * Mirrors the canonical status union owned by `UploadItemRow` so item state
 * and row rendering cannot drift apart.
 */
export type TUploadItemStatus = TUploadItemRowStatus;

export type TUploadItem = {
  refId: string;
  name: string;
  status: TUploadItemStatus;
  /** Local file uri: previews the file, and re-uploads it on resume. */
  uri?: string;
  /** MIME type, used to pick the row thumbnail (image vs pdf vs other). */
  mimeType?: string;
  bytesSent?: number;
  totalBytes?: number;
  /**
   * S3 credentials issued for this file. Held here so a session is a
   * complete description of its own upload: a resume that finds the bytes
   * already in S3 can save them without re-sending, and nothing has to
   * mirror this into a second store.
   */
  presignedKey?: string;
  uploadToken?: string;
};

/**
 * A logical upload, and the single source of truth about it.
 *
 * Two things are deliberately absent. Progress counts (`total`, `completed`,
 * `failed`, `complete`) are derived from `items` by `uploadSessionCounts` —
 * as stored fields they needed hand-maintained arithmetic in five places and
 * drifted. The runner that performs the work lives in the registry — as
 * callbacks here they made this type unserializable.
 *
 * What remains is plain data complete enough to persist and reload, which is
 * what `uploadManifestSync` does with it.
 */
export type TUploadSession = {
  id: string;
  stage: TUploadStage;
  items: TUploadItem[];
  /** Human-readable label (e.g. the doc type). */
  label?: string;
  /** Optional, flow-specific failure detail shown with the failed items. */
  errorMessage?: string;
  /**
   * Owning client profile id (docs uploads set it) so global surfaces can
   * attribute background sessions to a client.
   */
  clientId?: string;
  /**
   * Document namespace. Its presence is also what marks a session as
   * resumable: only sessions carrying enough context to be re-run from a
   * cold start get persisted.
   */
  namespace?: string;
  /** Epoch ms, for presign-reuse and staleness decisions on resume. */
  createdAt?: number;
  /**
   * What the attached runner supports, as plain booleans so the UI can gate
   * on them reactively.
   */
  cancellable?: boolean;
  retryable?: boolean;
};

export type TStartUploadOptions = {
  label?: string;
  clientId?: string;
  namespace?: string;
  createdAt?: number;
  cancellable?: boolean;
  retryable?: boolean;
  /** Caller-owned refIds, aligned with `names`, stable across retry runs. */
  refIds: string[];
  /**
   * Per-file source metadata, aligned with `names`, so upload rows can
   * preview the actual file (local image uri, pdf icon, etc.).
   */
  files?: Array<{ uri?: string; type?: string }>;
};
