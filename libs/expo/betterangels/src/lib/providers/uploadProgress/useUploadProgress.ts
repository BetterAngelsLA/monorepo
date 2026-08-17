import { useAtomValue } from 'jotai';
import {
  cancelUploadItemSession,
  completeUploadSession,
  dismissFailedUploadItemsSession,
  endUploadSession,
  failUploadSession,
  retryUploadItemsSession,
  setUploadManifestSession,
  startUploadSession,
  updateUploadSession,
  uploadSessionsAtom,
} from './uploadProgressAtoms';
import type { TUploadProgressContextValue } from './uploadProgressTypes';

/**
 * Jotai-backed replacement for the old context API. Session state lives in
 * module-scoped atoms, so no provider is needed and any component (upload
 * screen, global progress bar, flows) reads the same live state.
 */
export function useUploadProgress(): TUploadProgressContextValue {
  const sessions = useAtomValue(uploadSessionsAtom);

  return {
    sessions,
    startUpload: startUploadSession,
    setUploadManifest: setUploadManifestSession,
    updateUpload: updateUploadSession,
    failUpload: failUploadSession,
    completeUpload: completeUploadSession,
    endUpload: endUploadSession,
    cancelUploadItem: cancelUploadItemSession,
    retryUploadItems: retryUploadItemsSession,
    dismissFailedUploadItems: dismissFailedUploadItemsSession,
  };
}
