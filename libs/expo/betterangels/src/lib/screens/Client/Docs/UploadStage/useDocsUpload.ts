import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { randomUUID } from 'expo-crypto';
import { getDefaultStore } from 'jotai';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  uploadStageVisibleAtom,
  useUploadSession,
} from '../../../../providers';
import { useClientDocumentUpload } from '../UploadModal/useClientDocumentUpload';

/**
 * Starts and runs client-doc upload sessions. Sessions are registered in the
 * Jotai store immediately, so progress surfaces wherever the user is — the
 * global top bar (primary) or the upload stage detail screen.
 *
 * Terminal feedback is a root-level snackbar, but only when the upload stage
 * is NOT open (the stage renders its own Done/Retry state).
 */
export function useDocsUpload(clientProfileId?: string) {
  const {
    begin,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
  } = useUploadSession();
  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const startSession = (
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
    title: string,
    groupId: string = randomUUID(),
  ) => {
    // Register nothing until the session can actually run: a session begun
    // without a client id would never complete, never fail, and never be
    // cleaned up, pinning the global progress bar at "Uploading 0 of N".
    if (!clientProfileId) {
      return;
    }

    const handle = begin(
      files.map((file) => file.name),
      {
        label: title,
        clientId: clientProfileId,
        groupId,
        // Local file metadata so upload rows can preview the actual file.
        files: files.map((file) => ({ uri: file.uri, type: file.type })),
        // Retrying a failed item re-runs only that file in a fresh session
        // with the same group id — successful files were already persisted.
        onRetryItem: (index) =>
          startSession([files[index]], namespace, title, groupId),
      },
    );

    const runUpload = async () => {
      try {
        await uploadDocuments({
          clientProfileId,
          // Each file carries its own abort signal so per-file cancel works.
          documents: files.map((file, index) => ({
            ...file,
            signal: handle.signals[index],
          })),
          namespace,
          onManifest: (manifest) => setUploadManifest(handle.id, manifest),
          onProgress: (progress) => updateUpload(handle.id, progress),
        });

        if (handle.isAborted()) {
          // Every file was cancelled; the pipeline skipped them. Nothing was
          // saved, so don't report success.
          endUpload(handle.id);
          return;
        }

        completeUpload(handle.id);
        if (!getDefaultStore().get(uploadStageVisibleAtom)) {
          showSnackbar({ message: 'Upload complete', type: 'success' });
        }
      } catch (err) {
        console.error(`[useDocsUpload upload error:] ${err}`);

        if (handle.isAborted()) {
          endUpload(handle.id);
          return;
        }

        failUpload(handle.id, 'Upload failed. Use Retry on the file below.');
        if (!getDefaultStore().get(uploadStageVisibleAtom)) {
          showSnackbar({
            message: 'Upload failed. Please try again.',
            type: 'error',
          });
        }
      }
    };

    void runUpload();
  };

  return { startSession };
}
