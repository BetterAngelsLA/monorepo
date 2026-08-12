import { createContext, useContext } from 'react';
import type { TUploadProgress, TUploadStage } from '@monorepo/expo/shared/services';

export type TUploadItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export type TUploadItem = {
  refId: string;
  name: string;
  status: TUploadItemStatus;
  bytesSent?: number;
  totalBytes?: number;
  /** Aborts this file's upload. Invoked by the per-item cancel in the in-flight row. */
  onCancel?: () => void;
  /** Re-runs this file's upload. Invoked by the per-item retry in the in-flight row. */
  onRetry?: () => void;
};

export type TUploadSession = {
  id: string;
  stage: TUploadStage;
  items: TUploadItem[];
  completed: number;
  total: number;
  failed: boolean;
  /** True once the session finished successfully and is awaiting dismissal. */
  complete?: boolean;
  /** Human-readable label (e.g. the doc type) shown in the in-flight row. */
  label?: string;
  /** Optional, flow-specific failure detail shown in the in-flight row's failed state. */
  errorMessage?: string;
  /**
   * Destination surface for in-flight rows. Docs uploads set this to the
   * folder title ('Doc Ready' | 'Forms' | 'Other') so the docs tree can
   * render per-folder progress; flows without a destination leave it unset.
   */
  folder?: string;
};

export type TUploadManifestEntry = {
  refId: string;
  file: { name: string };
};

export type TUploadProgressContextValue = {
  sessions: TUploadSession[];
  /** Registers a new upload session with the display names of its files. */
  startUpload: (
    id: string,
    names: string[],
    options?: {
      onCancelItem?: (index: number) => void;
      label?: string;
      onRetryItem?: (index: number) => void;
      folder?: string;
    },
  ) => void;
  /** Pairs pipeline refIds with file names once the manifest is built. */
  setUploadManifest: (id: string, manifest: TUploadManifestEntry[]) => void;
  /** Applies a pipeline progress event to a session. */
  updateUpload: (id: string, progress: TUploadProgress) => void;
  /** Marks a session as failed (optionally with a flow-specific message). */
  failUpload: (id: string, errorMessage?: string) => void;
  /** Marks a session as completed; in-flight rows then disappear as the refetch brings the real items in. */
  completeUpload: (id: string) => void;
  /** Removes a session (upload finished, success or failure). */
  endUpload: (id: string) => void;
  /** Aborts and removes a single item from a session. */
  cancelUploadItem: (sessionId: string, refId: string) => void;
  /** Removes a failed item from its session and starts its per-item retry. */
  retryUploadItem: (sessionId: string, refId: string) => void;
};

export const UploadProgressContext =
  createContext<TUploadProgressContextValue | undefined>(undefined);

export function useUploadProgress(): TUploadProgressContextValue {
  const value = useContext(UploadProgressContext);

  if (!value) {
    throw new Error(
      'useUploadProgress must be used within an UploadProgressProvider',
    );
  }

  return value;
}
