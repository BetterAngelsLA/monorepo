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
  /** Local file uri (images preview the actual file in upload rows). */
  uri?: string;
  /** MIME type, used to pick the row thumbnail (image vs pdf vs other). */
  mimeType?: string;
  bytesSent?: number;
  totalBytes?: number;
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
   * What the attached runner supports, as plain booleans so the UI can gate
   * on them reactively. The runner itself lives in the registry, not here —
   * this type has to stay serializable so sessions can be persisted and
   * reloaded after the app restarts.
   */
  cancellable?: boolean;
  retryable?: boolean;
};

export type TUploadManifestEntry = {
  refId: string;
  file: { name: string };
};

export type TStartUploadOptions = {
  label?: string;
  clientId?: string;
  cancellable?: boolean;
  retryable?: boolean;
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

