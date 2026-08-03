import { randomUUID } from 'expo-crypto';
import { useUploadProgress } from './UploadProgressContext';

type TUploadSessionHandle = {
  id: string;
  /** Abort signal to pass to the upload pipeline so cancellation works. */
  signal: AbortSignal;
  /** True once the session has been cancelled via the drawer. */
  isAborted: () => boolean;
};

/**
 * Wraps the UploadProgressProvider API for a single upload, pairing the
 * session with an AbortController so the drawer's cancel button actually
 * aborts the in-flight upload.
 */
export function useUploadSession() {
  const { startUpload, setUploadManifest, updateUpload, failUpload, endUpload } =
    useUploadProgress();

  const begin = (names: string[]): TUploadSessionHandle => {
    const id = randomUUID();
    const controller = new AbortController();

    startUpload(id, names, () => controller.abort());

    return {
      id,
      signal: controller.signal,
      isAborted: () => controller.signal.aborted,
    };
  };

  return { begin, setUploadManifest, updateUpload, failUpload, endUpload };
}

export type { TUploadSessionHandle };
