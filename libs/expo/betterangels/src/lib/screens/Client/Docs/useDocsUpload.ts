import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { randomUUID } from 'expo-crypto';
import { getDefaultStore } from 'jotai';
import { ClientDocumentNamespaceEnum } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import {
  deleteUploadManifest,
  failUploadSession,
  getUploadSession,
  markUploadPartiallyFailed,
  saveUploadManifest,
  updateUploadManifestItems,
  uploadStageVisibleAtom,
  useUploadSession,
} from '../../../providers';
import { useClientDocumentUpload } from './UploadModal/useClientDocumentUpload';

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
    /** Overrides the hook's client, for resumed sessions from a manifest. */
    forClientProfileId?: string,
  ) => {
    const clientId = forClientProfileId ?? clientProfileId;

    // Register nothing until the session can actually run: a session begun
    // without a client id would never complete, never fail, and never be
    // cleaned up, pinning the global progress bar at "Uploading 0 of N".
    if (!clientId) {
      return;
    }

    // Own the correlation ids up front so every run — the first and any
    // retry — reports against the same rows.
    const refIds = files.map(() => randomUUID());
    const indexByRefId = new Map(refIds.map((refId, index) => [refId, index]));

    // Persisted before anything is sent, so a crash at any point after this
    // leaves a record that says what was being uploaded and for whom.
    const sessionId = randomUUID();

    void saveUploadManifest({
      id: sessionId,
      clientProfileId: clientId,
      namespace,
      label: title,
      createdAt: Date.now(),
      items: files.map((file, index) => ({
        refId: refIds[index],
        name: file.name,
        uri: file.uri,
        mimeType: file.type,
        status: 'pending',
      })),
    });

    /**
     * Mirrors per-file outcomes into the persisted manifest so a resume
     * knows which files still need bytes sent and which only need saving.
     */
    const recordItemProgress = (progress: {
      refId?: string;
      status?: string;
    }) => {
      if (!progress.refId || !progress.status) {
        return;
      }

      const status =
        progress.status === 'done'
          ? 'uploaded'
          : progress.status === 'error'
            ? 'error'
            : undefined;

      if (!status) {
        return;
      }

      void updateUploadManifestItems(sessionId, (items) =>
        items.map((item) =>
          item.refId === progress.refId ? { ...item, status } : item,
        ),
      );
    };

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
          clientProfileId: clientId,
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
          onPresigned: (uploads) =>
            void updateUploadManifestItems(sessionId, (items) =>
              items.map((item) => {
                const issued = uploads.find(
                  (upload) => upload.refId === item.refId,
                );

                return issued
                  ? {
                      ...item,
                      presignedKey: issued.presignedKey,
                      uploadToken: issued.uploadToken,
                    }
                  : item;
              }),
            ),
          onProgress: (progress) => {
            updateUpload(handle.id, progress);
            recordItemProgress(progress);
          },
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
        // Nothing left to recover.
        void deleteUploadManifest(sessionId);
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
        clientId,
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
