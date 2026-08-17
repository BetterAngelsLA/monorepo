import type {
  TUploadProgress,
  TUploadStage,
} from '@monorepo/expo/shared/services';
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
  /** Local file uri (images preview the actual file in upload rows). */
  uri?: string;
  /** MIME type, used to pick the row thumbnail (image vs pdf vs other). */
  mimeType?: string;
  bytesSent?: number;
  totalBytes?: number;
  /** Aborts this file's upload. Invoked by the per-item cancel action. */
  onCancel?: () => void;
};

/**
 * A logical upload. Progress counts (`total`, `completed`, `failed`,
 * `complete`) are deliberately NOT stored here — they are derived from
 * `items` by `uploadSessionCounts`. Keeping them as fields meant five
 * separate places had to keep the arithmetic in sync whenever an item was
 * added, cancelled, or retried, and they drifted.
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
   * Re-runs the given files inside this session. Retry is in-place: the
   * items go back to `pending` and a fresh transport run reports against
   * their existing refIds, so one user action stays one session no matter
   * how many times its files are retried.
   */
  onRetryItems?: (refIds: string[]) => void;
};

export type TUploadManifestEntry = {
  refId: string;
  file: { name: string };
};

export type TStartUploadOptions = {
  onCancelItem?: (index: number) => void;
  label?: string;
  clientId?: string;
  onRetryItems?: (refIds: string[]) => void;
  /**
   * Caller-owned refIds, aligned with `names`. Supply them when the flow
   * needs stable item identity across retry runs; omitted for flows that
   * pair names to refIds later via `setUploadManifest`.
   */
  refIds?: string[];
  /**
   * Per-file source metadata, aligned with `names`, so upload rows can
   * preview the actual file (local image uri, pdf icon, etc.).
   */
  files?: Array<{ uri?: string; type?: string }>;
};

export type TUploadProgressContextValue = {
  sessions: TUploadSession[];
  /** Registers a new upload session with the display names of its files. */
  startUpload: (
    id: string,
    names: string[],
    options?: TStartUploadOptions,
  ) => void;
  /** Pairs pipeline refIds with file names once the manifest is built. */
  setUploadManifest: (id: string, manifest: TUploadManifestEntry[]) => void;
  /** Applies a pipeline progress event to a session. */
  updateUpload: (id: string, progress: TUploadProgress) => void;
  /** Marks a session as failed (optionally with a flow-specific message). */
  failUpload: (id: string, errorMessage?: string) => void;
  /** Marks a session as completed. */
  completeUpload: (id: string) => void;
  /** Removes a session. */
  endUpload: (id: string) => void;
  /** Aborts and removes a single item from a session. */
  cancelUploadItem: (sessionId: string, refId: string) => void;
  /** Resets the given failed items and re-runs them inside their session. */
  retryUploadItems: (sessionId: string, refIds: string[]) => void;
};
