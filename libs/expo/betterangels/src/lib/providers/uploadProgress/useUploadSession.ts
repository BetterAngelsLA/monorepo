import { useRef } from 'react';
import { randomUUID } from 'expo-crypto';
import { TUploadManifestEntry, useUploadProgress } from './UploadProgressContext';

type TUploadSessionHandle = {
  id: string;
  /** Abort signal to pass to the upload pipeline so cancellation works. */
  signal: AbortSignal;
  /** True once the session has been cancelled (via `cancel` or the drawer). */
  isAborted: () => boolean;
};

/**
 * Wraps the UploadProgressProvider API for a single upload, pairing the
 * session with an AbortController so the drawer's cancel button actually
 * aborts the in-flight upload.
 */
export function useUploadSession() {
  const {
    startUpload,
    setUploadManifest,
    updateUpload,
    endUpload,
    cancelUpload,
  } = useUploadProgress();

  const controllerRef = useRef<AbortController | null>(null);

  const begin = (names: string[]): TUploadSessionHandle => {
    const id = randomUUID();
    const controller = new AbortController();

    controllerRef.current = controller;
    startUpload(id, names, () => controller.abort());

    return {
      id,
      signal: controller.signal,
      isAborted: () => controller.signal.aborted,
    };
  };

  const cancel = (id: string) => cancelUpload(id);

  return { begin, cancel, setUploadManifest, updateUpload, endUpload };
}

export type { TUploadManifestEntry, TUploadSessionHandle };
