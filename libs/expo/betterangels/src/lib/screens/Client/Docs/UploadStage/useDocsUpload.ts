import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { randomUUID } from 'expo-crypto';
import { getDefaultStore } from 'jotai';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  failUploadSession,
  getUploadSession,
  markUploadPartiallyFailed,
  uploadStageVisibleAtom,
  useUploadSession,
} from '../../../../providers';
import { useClientDocumentUpload } from '../UploadModal/useClientDocumentUpload';

/**
 * Starts and runs client-doc upload sessions. Sessions are registered in the
 * Jotai store immediately, so progress surfaces wherever the user is — the
 * global top bar (primary) or the upload stage detail screen.
 *
 * One user action is one session for its whole life. Retrying failed files
 * re-runs them *inside* that session against their original refIds rather
 * than spawning a replacement, so the row the user is looking at is the row
 * that updates, and retrying several files costs a single transport run.
 *
 * Terminal feedback is a root-level snackbar, but only when the upload stage
 * is NOT open (the stage renders its own Done/Retry state).
 */
export function useDocsUpload(clientProfileId?: string) {
  const { begin, updateUpload, completeUpload, endUpload } = useUploadSession();
  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const startSession = (
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
    title: string,
  ) => {
    // Register nothing until the session can actually run: a session begun
    // without a client id would never complete, never fail, and never be
    // cleaned up, pinning the global progress bar at "Uploading 0 of N".
    if (!clientProfileId) {
      return;
    }

    // Own the correlation ids up front so every run — the first and any
    // retry — reports against the same rows.
    const refIds = files.map(() => randomUUID());
    const indexByRefId = new Map(refIds.map((refId, index) => [refId, index]));

    const runFiles = async (targetRefIds: string[]) => {
      const indexes = targetRefIds
        .map((refId) => indexByRefId.get(refId))
        .filter((index): index is number => index !== undefined);

      if (!indexes.length) {
        return;
      }

      // A retry needs controllers that are not already aborted, and cancel
      // must abort the run that is actually in flight.
      const signals = handle.renewSignals(indexes);

      try {
        await uploadDocuments({
          clientProfileId,
          // Each file carries its own abort signal so per-file cancel works.
          documents: indexes.map((index) => ({
            ...files[index],
            refId: refIds[index],
            signal: signals[index],
          })),
          namespace,
          // No onManifest: this flow supplies its own refIds, so the session
          // items are already correlated. Letting the manifest rebuild them
          // would replace the whole item list with just this run's files —
          // wiping the rest of the session on every retry.
          onProgress: (progress) => updateUpload(handle.id, progress),
        });

        if (indexes.every((index) => signals[index]?.aborted)) {
          // Every file in this run was cancelled; the pipeline skipped them.
          // Nothing was saved, so don't report success.
          if (!getUploadSession(handle.id)?.items.length) {
            endUpload(handle.id);
          }
          return;
        }

        settle();
      } catch (err) {
        console.error(`[useDocsUpload upload error:] ${err}`);

        if (indexes.every((index) => signals[index]?.aborted)) {
          if (!getUploadSession(handle.id)?.items.length) {
            endUpload(handle.id);
          }
          return;
        }

        failUploadSession(
          handle.id,
          'Upload failed. Use Retry on the files below.',
        );
        notify('Upload failed. Please try again.', 'error');
      }
    };

    /**
     * The save step ran, so everything not already in error is persisted.
     * With `failFast: false` the pipeline resolves even when some files
     * failed, so the session decides between success and partial failure
     * from its own item state.
     */
    const settle = () => {
      completeUpload(handle.id);

      const settled = getUploadSession(handle.id);
      const failedCount =
        settled?.items.filter((item) => item.status === 'error').length ?? 0;

      if (failedCount === 0) {
        notify('Upload complete', 'success');
        return;
      }

      markUploadPartiallyFailed(
        handle.id,
        `${failedCount} of ${settled?.items.length} files failed to upload. Use Retry below.`,
      );
      notify(
        `${failedCount} file${failedCount === 1 ? '' : 's'} failed to upload.`,
        'error',
      );
    };

    const notify = (message: string, type: 'success' | 'error') => {
      // The stage renders its own terminal state; a snackbar behind it would
      // be redundant (and invisible).
      if (!getDefaultStore().get(uploadStageVisibleAtom)) {
        showSnackbar({ message, type });
      }
    };

    const handle = begin(
      files.map((file) => file.name),
      {
        label: title,
        clientId: clientProfileId,
        refIds,
        // Local file metadata so upload rows can preview the actual file.
        files: files.map((file) => ({ uri: file.uri, type: file.type })),
        onRetryItems: (retryRefIds) => void runFiles(retryRefIds),
      },
    );

    void runFiles(refIds);
  };

  return { startSession };
}
