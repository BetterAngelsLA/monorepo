import { randomUUID } from 'expo-crypto';
import {
  completeUploadSession,
  endUploadSession,
  failUploadSession,
  setUploadManifestSession,
  startUploadSession,
  updateUploadSession,
} from './uploadProgressAtoms';
import {
  registerUploadRunner,
  type TUploadRunner,
} from './uploadRunnerRegistry';

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
 * in-flight upload.
 *
 * Only background, multi-file, cancellable work belongs here. Modal flows
 * that block on their own overlay (HMIS documents, profile photos) manage
 * their own state — putting them in this store only produced phantom rows in
 * the global progress bar for uploads the user was already watching.
 *
 * The abort controllers and the retry callback go into the runner registry
 * rather than onto the session, so session state stays plain serializable
 * data and the upload's lifetime is not tied to the component that started
 * it.
 */
export function useUploadSession() {
  const begin = (
    names: string[],
    options?: TBeginOptions,
  ): TUploadSessionHandle => {
    const id = randomUUID();
    // Mutable so a retry can swap in fresh controllers while the registry's
    // cancel lookup — which resolves by refId — keeps working.
    const controllers = names.map(() => new AbortController());
    const refIds = names.map(
      (_, index) => options?.refIds?.[index] ?? `pending-${index}`,
    );

    startUploadSession(id, names, {
      label: options?.label,
      clientId: options?.clientId,
      refIds: options?.refIds,
      files: options?.files,
      cancellable: true,
      retryable: !!options?.onRetryItems,
    });

    const runner: TUploadRunner = {
      cancelItem: (refId) => {
        const index = refIds.indexOf(refId);

        if (index >= 0) {
          controllers[index]?.abort();
        }
      },
      rerun: (retryRefIds) => options?.onRetryItems?.(retryRefIds),
    };

    registerUploadRunner(id, runner);

    return {
      id,
      signals: names.map((_, index) => controllers[index]?.signal),
      isAborted: () =>
        controllers.length > 0 &&
        controllers.every((controller) => controller.signal.aborted),
      renewSignals: (indexes: number[]) => {
        indexes.forEach((index) => {
          if (controllers[index]) {
            controllers[index] = new AbortController();
          }
        });

        return names.map((_, index) => controllers[index]?.signal);
      },
    };
  };

  return {
    begin,
    setUploadManifest: setUploadManifestSession,
    updateUpload: updateUploadSession,
    failUpload: failUploadSession,
    completeUpload: completeUploadSession,
    endUpload: endUploadSession,
  };
}

export type { TUploadSessionHandle };
