import { ReactNode, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { UploadProgressContext } from './UploadProgressContext';
import {
  cancelUploadItemSession,
  completeUploadSession,
  endUploadSession,
  failUploadSession,
  getUploadSnapshot,
  retryUploadItemSession,
  setUploadManifestSession,
  startUploadSession,
  subscribeUploadStore,
  updateUploadSession,
} from './uploadProgressStore';

type TUploadProgressProviderProps = {
  children: ReactNode;
};

/**
 * Provides the app-wide upload session API. Session state lives in a
 * module-scoped store (see uploadProgressStore) so this component is just a
 * thin binding. It is mounted both at the app root and inside the modal
 * screen so uploads that start in a modal survive the modal unmounting.
 *
 * Successfully completed sessions are not rendered anywhere (the docs tree
 * hides them and the refetched query shows the real rows), so they are
 * dropped shortly after finishing to keep the module store from growing
 * unboundedly. Failed sessions persist — the docs tree renders their retry
 * affordance.
 */
const COMPLETE_CLEANUP_DELAY_MS = 3000;

export function UploadProgressProvider(props: TUploadProgressProviderProps) {
  const { children } = props;
  const { sessions } = useSyncExternalStore(subscribeUploadStore, getUploadSnapshot);

  const cleanupTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    for (const session of sessions) {
      if (!session.complete || cleanupTimers.current.has(session.id)) {
        continue;
      }

      cleanupTimers.current.set(
        session.id,
        setTimeout(
          () => endUploadSession(session.id),
          COMPLETE_CLEANUP_DELAY_MS,
        ),
      );
    }
  }, [sessions]);

  // Clear pending cleanup timers when the provider unmounts.
  useEffect(() => {
    const timers = cleanupTimers.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      startUpload: startUploadSession,
      setUploadManifest: setUploadManifestSession,
      updateUpload: updateUploadSession,
      failUpload: failUploadSession,
      completeUpload: completeUploadSession,
      endUpload: endUploadSession,
      cancelUploadItem: cancelUploadItemSession,
      retryUploadItem: retryUploadItemSession,
    }),
    [sessions],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}
