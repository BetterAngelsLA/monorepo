import { createContext, useContext } from 'react';
import type { TUploadProgress, TUploadStage } from '@monorepo/expo/shared/services';

export type TUploadItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export type TUploadItem = {
  refId: string;
  name: string;
  status: TUploadItemStatus;
  bytesSent?: number;
  totalBytes?: number;
};

export type TUploadSession = {
  id: string;
  stage: TUploadStage;
  items: TUploadItem[];
  completed: number;
  total: number;
  failed: boolean;
};

export type TUploadManifestEntry = {
  refId: string;
  file: { name: string };
};

export type TUploadProgressContextValue = {
  sessions: TUploadSession[];
  /** Registers a new upload session with the display names of its files. */
  startUpload: (id: string, names: string[]) => void;
  /** Pairs pipeline refIds with file names once the manifest is built. */
  setUploadManifest: (id: string, manifest: TUploadManifestEntry[]) => void;
  /** Applies a pipeline progress event to a session. */
  updateUpload: (id: string, progress: TUploadProgress) => void;
  /** Removes a session (upload finished, success or failure). */
  endUpload: (id: string) => void;
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
