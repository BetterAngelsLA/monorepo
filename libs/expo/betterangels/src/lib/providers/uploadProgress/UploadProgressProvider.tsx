import {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TUploadProgress } from '@monorepo/expo/shared/services';
import { UploadProgressContext } from './UploadProgressContext';
import {
  TUploadItemStatus,
  TUploadManifestEntry,
  TUploadSession,
} from './UploadProgressContext';
import { UploadProgressDrawer } from './UploadProgressDrawer';

type TUploadProgressProviderProps = {
  children: ReactNode;
};

/**
 * Tracks active upload sessions app-wide and renders a progress drawer while
 * any upload is in flight. Mirrors the SnackbarProvider pattern and is
 * mounted both at the app root and inside the modal screen so the drawer
 * appears above full-screen modals.
 */
export function UploadProgressProvider(props: TUploadProgressProviderProps) {
  const { children } = props;

  const [sessions, setSessions] = useState<TUploadSession[]>([]);
  // Cancellation handlers keyed by session id, kept out of state so cancel
  // works even between renders.
  const cancelHandlersRef = useRef(new Map<string, () => void>());

  const startUpload = useCallback(
    (id: string, names: string[], onCancel?: () => void) => {
      if (onCancel) {
        cancelHandlersRef.current.set(id, onCancel);
      }

      setSessions((prev) => [
        ...prev,
        {
          id,
          stage: 'GENERATING',
          items: names.map((name, index) => ({
            refId: `pending-${index}`,
            name,
            status: 'pending' as TUploadItemStatus,
          })),
          completed: 0,
          total: names.length,
          failed: false,
          onCancel,
        },
      ]);
    },
    [],
  );

  const setUploadManifest = useCallback(
    (id: string, manifest: TUploadManifestEntry[]) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== id) {
            return session;
          }

          return {
            ...session,
            items: manifest.map((entry, index) => ({
              refId: entry.refId,
              name: session.items[index]?.name ?? entry.file.name,
              status: session.items[index]?.status ?? 'pending',
            })),
          };
        }),
      );
    },
    [],
  );

  const updateUpload = useCallback((id: string, progress: TUploadProgress) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== id) {
          return session;
        }

        const items = progress.refId
          ? session.items.map((item) =>
              item.refId === progress.refId
                ? {
                    ...item,
                    status: toItemStatus(progress.status),
                    ...(typeof progress.bytesSent === 'number' &&
                    typeof progress.totalBytes === 'number'
                      ? {
                          bytesSent: progress.bytesSent,
                          totalBytes: progress.totalBytes,
                        }
                      : {}),
                  }
                : item,
            )
          : session.items;

        return {
          ...session,
          stage: progress.stage,
          completed: progress.completed,
          total: progress.total,
          items,
          failed: session.failed || progress.status === 'error',
        };
      }),
    );
  }, []);

  const failUpload = useCallback((id: string, errorMessage?: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id !== id
          ? session
          : {
              ...session,
              failed: true,
              errorMessage,
              items: session.items.map((item) =>
                item.status === 'done'
                  ? item
                  : { ...item, status: 'error' as TUploadItemStatus },
              ),
            },
      ),
    );
  }, []);

  const endUpload = useCallback((id: string) => {
    cancelHandlersRef.current.delete(id);
    setSessions((prev) => prev.filter((session) => session.id !== id));
  }, []);

  const cancelUpload = useCallback((id: string) => {
    cancelHandlersRef.current.get(id)?.();
    cancelHandlersRef.current.delete(id);
    setSessions((prev) => prev.filter((session) => session.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      startUpload,
      setUploadManifest,
      updateUpload,
      failUpload,
      endUpload,
      cancelUpload,
    }),
    [
      sessions,
      startUpload,
      setUploadManifest,
      updateUpload,
      failUpload,
      endUpload,
      cancelUpload,
    ],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
      <UploadProgressDrawer />
    </UploadProgressContext.Provider>
  );
}

function toItemStatus(status: TUploadProgress['status']): TUploadItemStatus {
  switch (status) {
    case 'done':
      return 'done';
    case 'error':
      return 'error';
    case 'uploading':
      return 'uploading';
    default:
      return 'pending';
  }
}
