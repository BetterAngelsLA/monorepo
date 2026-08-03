import { randomUUID } from 'expo-crypto';
import { useUploadProgress } from './UploadProgressContext';

type TUploadSessionHandle = {
  id: string;
  /** Abort signal to pass to the upload pipeline so cancellation works. */
  signal: AbortSignal | undefined;
  /** True once the session has been cancelled via the drawer. */
  isAborted: () => boolean;
};

type TBeginOptions = {
  /** When false the session is not abortable (drawer shows no Cancel). */
  cancellable?: boolean;
};

/**
 * Wraps the UploadProgressProvider API for a single upload, pairing the
 * session with an AbortController so the drawer's cancel button actually
 * aborts the in-flight upload. Pass `{ cancellable: false }` for flows with
 * no abort support (e.g. HMIS base64/multipart uploads).
 */
export function useUploadSession() {
  const {
    startUpload,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
  } = useUploadProgress();

  const begin = (
    names: string[],
    options?: TBeginOptions,
  ): TUploadSessionHandle => {
    const id = randomUUID();
    const cancellable = options?.cancellable !== false;
    const controller = cancellable ? new AbortController() : undefined;

    startUpload(id, names, controller ? () => controller.abort() : undefined);

    return {
      id,
      signal: controller?.signal,
      isAborted: () => controller?.signal.aborted ?? false,
    };
  };

  return {
    begin,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
  };
}

export type { TUploadSessionHandle };
