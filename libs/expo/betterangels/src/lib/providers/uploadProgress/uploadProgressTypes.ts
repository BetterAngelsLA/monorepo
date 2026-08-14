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
  bytesSent?: number;
  totalBytes?: number;
  /** Aborts this file's upload. Invoked by the per-item cancel action. */
  onCancel?: () => void;
  /** Re-runs this file's upload. Invoked by the per-item retry action. */
  onRetry?: () => void;
};

export type TUploadSession = {
  id: string;
  stage: TUploadStage;
  items: TUploadItem[];
  completed: number;
  total: number;
  failed: boolean;
  /** True once the session finished successfully and is awaiting cleanup. */
  complete?: boolean;
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
   * Groups sessions that belong to one logical upload (including retry
   * replacement sessions) so a resumed upload screen can find all of them
   * even after remounting.
   */
  groupId?: string;
};

export type TUploadManifestEntry = {
  refId: string;
  file: { name: string };
};

export type TStartUploadOptions = {
  onCancelItem?: (index: number) => void;
  label?: string;
  onRetryItem?: (index: number) => void;
  clientId?: string;
  groupId?: string;
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
  /** Removes a failed item from its session and starts its per-item retry. */
  retryUploadItem: (sessionId: string, refId: string) => void;
};
