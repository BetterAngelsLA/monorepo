import { randomUUID } from 'expo-crypto';
import { useUploadProgress } from './useUploadProgress';

type TUploadSessionHandle = {
  id: string;
  /**
   * Per-file abort signals, aligned with the names passed to `begin`. A
   * file's signal aborts when its per-item cancel is pressed.
   */
  signals: (AbortSignal | undefined)[];
  /** True once every cancellable file in the session has been cancelled. */
  isAborted: () => boolean;
};

type TBeginOptions = {
  /** When false the session is not abortable (no per-item Cancel). */
  cancellable?: boolean;
  /** Human-readable label (e.g. the doc type) shown in the queue. */
  label?: string;
  /** Starts a fresh single-file session when a failed item is retried. */
  onRetryItem?: (index: number) => void;
  /**
   * Owning client profile id (docs uploads) so global surfaces such as the
   * progress bar can attribute background sessions to a client.
   */
  clientId?: string;
  /**
   * Groups this session with its retry replacement sessions so an upload
   * screen can find all of them (even after remounting).
   */
  groupId?: string;
};

/**
 * Wraps the upload session API for a single upload, pairing the session with
 * an AbortController so the per-item cancel button actually aborts the
 * in-flight upload. Pass `{ cancellable: false }` for flows with no abort
 * support (e.g. HMIS base64/multipart uploads).
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
    const controllers = cancellable
      ? names.map(() => new AbortController())
      : undefined;

    startUpload(id, names, {
      onCancelItem: controllers
        ? (index: number) => controllers[index].abort()
        : undefined,
      label: options?.label,
      onRetryItem: options?.onRetryItem,
      clientId: options?.clientId,
      groupId: options?.groupId,
    });

    return {
      id,
      signals: names.map((_, index) => controllers?.[index]?.signal),
      isAborted: () =>
        controllers
          ? controllers.length > 0 &&
            controllers.every((controller) => controller.signal.aborted)
          : false,
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
