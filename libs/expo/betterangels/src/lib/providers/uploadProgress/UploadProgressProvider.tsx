import { ReactNode, useMemo, useSyncExternalStore } from 'react';
import { UploadProgressContext } from './UploadProgressContext';
import { UploadProgressDrawer } from './UploadProgressDrawer';
import {
  cancelUploadSession,
  completeUploadSession,
  endUploadSession,
  failUploadSession,
  getUploadSnapshot,
  setQueueOpenSession,
  setUploadManifestSession,
  startUploadSession,
  subscribeUploadStore,
  updateUploadSession,
} from './uploadProgressStore';

type TUploadProgressProviderProps = {
  children: ReactNode;
};

/**
 * Provides the app-wide upload session API and renders a progress drawer
 * while any upload is in flight. Session state lives in a module-scoped store
 * (see uploadProgressStore) so this component is just a thin binding. It is
 * mounted both at the app root and inside the modal screen so the drawer
 * appears above full-screen modals — and because both mounts share the same
 * store, the drawer survives the modal (and this provider) unmounting.
 */
export function UploadProgressProvider(props: TUploadProgressProviderProps) {
  const { children } = props;
  const { sessions, queueOpen } = useSyncExternalStore(
    subscribeUploadStore,
    getUploadSnapshot,
  );

  const value = useMemo(
    () => ({
      sessions,
      queueOpen,
      setQueueOpen: setQueueOpenSession,
      startUpload: startUploadSession,
      setUploadManifest: setUploadManifestSession,
      updateUpload: updateUploadSession,
      failUpload: failUploadSession,
      completeUpload: completeUploadSession,
      endUpload: endUploadSession,
      cancelUpload: cancelUploadSession,
    }),
    [sessions, queueOpen],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
      <UploadProgressDrawer />
    </UploadProgressContext.Provider>
  );
}
