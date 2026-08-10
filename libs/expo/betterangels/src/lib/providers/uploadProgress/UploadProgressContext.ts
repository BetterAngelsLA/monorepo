import { createContext, useContext } from 'react';
import type {
  TUploadProgress,
  TUploadStage,
} from '@monorepo/expo/shared/services';

export type TUploadItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export type TUploadItem = {
  refId: string;
  name: string;
  status: TUploadItemStatus;
  bytesSent?: number;
  totalBytes?: number;
  /** Aborts this file's upload. Invoked by the drawer's per-item cancel. */
  onCancel?: () => void;
  /** Re-runs this file's upload. Invoked by the drawer's per-item retry. */
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
  /** Human-readable label (e.g. the doc type) shown in the queue/drawer. */
  label?: string;
  /** Optional, flow-specific failure detail shown in the drawer's failed state. */
  errorMessage?: string;
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
    onCancelItem?: (index: number) => void,
    label?: string,
    onRetryItem?: (index: number) => void,
  ) => void;
  /** Pairs pipeline refIds with file names once the manifest is built. */
  setUploadManifest: (id: string, manifest: TUploadManifestEntry[]) => void;
  /** Applies a pipeline progress event to a session. */
  updateUpload: (id: string, progress: TUploadProgress) => void;
  /** Marks a session as failed (optionally with a flow-specific message). */
  failUpload: (id: string, errorMessage?: string) => void;
  /** Marks a session as completed so the drawer shows its done state. */
  completeUpload: (id: string) => void;
  /** Removes a session (upload finished, success or failure). */
  endUpload: (id: string) => void;
  /** Aborts and removes a single item from a session. */
  cancelUploadItem: (sessionId: string, refId: string) => void;
  /** Removes a failed item from its session and starts its per-item retry. */
  retryUploadItem: (sessionId: string, refId: string) => void;
};

export const UploadProgressContext = createContext<
  TUploadProgressContextValue | undefined
>(undefined);

export function useUploadProgress(): TUploadProgressContextValue {
  const value = useContext(UploadProgressContext);

  if (!value) {
    throw new Error(
      'useUploadProgress must be used within an UploadProgressProvider',
    );
  }

  return value;
}
