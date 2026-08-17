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
  /**
   * Replaces the abort controllers for the given item indexes and returns
   * their fresh signals. A retry run needs controllers that are not already
   * aborted, and the per-item cancel button must abort the *current* run.
   */
  renewSignals: (indexes: number[]) => (AbortSignal | undefined)[];
};

type TBeginOptions = {
  /** When false the session is not abortable (no per-item Cancel). */
  cancellable?: boolean;
  /** Human-readable label (e.g. the doc type) shown in the queue. */
  label?: string;
  /** Re-runs the given files in place when their rows are retried. */
  onRetryItems?: (refIds: string[]) => void;
  /**
   * Owning client profile id (docs uploads) so global surfaces such as the
   * progress bar can attribute background sessions to a client.
   */
  clientId?: string;
  /** Caller-owned refIds, aligned with `names`, stable across retry runs. */
  refIds?: string[];
  /**
   * Per-file source metadata, aligned with `names`, so upload rows can
   * preview the actual file.
   */
  files?: Array<{ uri?: string; type?: string }>;
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
    // Mutable so a retry can swap in fresh controllers while the per-item
    // cancel closures — which capture only the index — keep working.
    const controllers = cancellable
      ? names.map(() => new AbortController())
      : undefined;

    startUpload(id, names, {
      onCancelItem: controllers
        ? (index: number) => controllers[index].abort()
        : undefined,
      label: options?.label,
      onRetryItems: options?.onRetryItems,
      clientId: options?.clientId,
      refIds: options?.refIds,
      files: options?.files,
    });

    return {
      id,
      signals: names.map((_, index) => controllers?.[index]?.signal),
      isAborted: () =>
        controllers
          ? controllers.length > 0 &&
            controllers.every((controller) => controller.signal.aborted)
          : false,
      renewSignals: (indexes: number[]) => {
        indexes.forEach((index) => {
          if (controllers?.[index]) {
            controllers[index] = new AbortController();
          }
        });

        return names.map((_, index) => controllers?.[index]?.signal);
      },
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
