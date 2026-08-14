import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { FileOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextButton,
  TextRegular,
  UploadItemRow,
} from '@monorepo/expo/shared/ui-components';
import { randomUUID } from 'expo-crypto';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { useSnackbar } from '../../../../hooks';
import {
  setUploadStageVisible,
  uploadProgressPct,
  useUploadProgress,
  useUploadSession,
} from '../../../../providers';
import { useClientDocumentUpload } from '../UploadModal/useClientDocumentUpload';

export type TUploadSelection = {
  namespace: ClientDocumentNamespaceEnum;
  title: string;
  files: ReactNativeFile[];
};

type TUploadStageProps = {
  closeModal: () => void;
  /**
   * New upload: the files just picked, awaiting confirmation. The stage
   * opens in Ready state and uploads only after the user confirms.
   */
  selection?: TUploadSelection;
  /** Client whose docs are uploaded (required when `selection` is set). */
  clientProfileId?: string;
  /**
   * Resume: show the background sessions with these ids (e.g. re-opened from
   * the global progress bar). The stage derives live item state from the
   * store, so it works after remounting.
   */
  resumeSessionIds?: string[];
};

type TStage = 'ready' | 'uploading' | 'done';

/** Minimum time the Done state stays visible before auto-closing. */
const DONE_MIN_VISIBLE_MS = 1500;

/**
 * The dedicated upload surface: confirm → per-file progress → done.
 *
 * Ready lists the selected files with Upload/Cancel. Uploading shows one
 * UploadItemRow per file with per-file cancel. Done shows final per-file
 * status (with Retry on failures) and stays visible for at least
 * `DONE_MIN_VISIBLE_MS` so fast uploads are still perceived, then
 * auto-closes. Dismissing mid-upload leaves the sessions running — they are
 * picked up by the global progress bar.
 */
export default function UploadStage(props: TUploadStageProps) {
  const {
    closeModal,
    selection,
    clientProfileId,
    resumeSessionIds = [],
  } = props;

  const { sessions, cancelUploadItem, retryUploadItem, endUpload } =
    useUploadProgress();
  const { begin, setUploadManifest, updateUpload, failUpload, completeUpload } =
    useUploadSession();
  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const [stage, setStage] = useState<TStage>(selection ? 'ready' : 'uploading');

  const isMountedRef = useRef(true);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeIdsRef = useRef<string[]>(resumeSessionIds);

  // One group id per logical upload, stable across retry replacement
  // sessions and screen remounts. New uploads mint one; resumed screens
  // adopt the group id of the sessions they were opened for.
  const [groupId] = useState(() => {
    const resumed = sessions.find((session) =>
      resumeSessionIds.includes(session.id),
    );
    return resumed?.groupId ?? (selection ? randomUUID() : undefined);
  });

  // Hide the global progress bar while this screen shows per-file progress.
  useEffect(() => {
    setUploadStageVisible(true);
    return () => setUploadStageVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Sessions belonging to this upload stage: everything sharing the group id
  // (including retry replacement sessions). Sessions without a group id fall
  // back to the explicitly resumed ids.
  const ownedSessions = useMemo(() => {
    if (groupId) {
      return sessions.filter((session) => session.groupId === groupId);
    }

    return sessions.filter((session) =>
      resumeIdsRef.current.includes(session.id),
    );
  }, [sessions, groupId]);

  const allComplete =
    ownedSessions.length > 0 &&
    ownedSessions.every((session) => session.complete);
  const anyInFlight = ownedSessions.some(
    (session) => !session.complete && !session.failed,
  );
  const anyFailed = ownedSessions.some((session) => session.failed);

  const scheduleAutoClose = () => {
    autoCloseTimerRef.current = setTimeout(closeModal, DONE_MIN_VISIBLE_MS);
  };

  // Stage transitions driven by session state (so a resumed screen reacts to
  // sessions that finish or fail after remounting):
  //   all complete → Done + auto-close; anything in flight → Uploading;
  //   everything settled with failures → Done (Retry affordance stays).
  useEffect(() => {
    if (stage === 'ready' || ownedSessions.length === 0) {
      return;
    }

    if (allComplete && stage !== 'done') {
      setStage('done');
      scheduleAutoClose();
      return;
    }

    if (anyInFlight) {
      setStage('uploading');
      return;
    }

    if (anyFailed) {
      setStage('done');
    }
  }, [ownedSessions, stage, allComplete, anyInFlight, anyFailed]);

  // Resumed sessions may have been cleaned up already; nothing to show.
  useEffect(() => {
    if (
      stage !== 'ready' &&
      resumeSessionIds.length > 0 &&
      ownedSessions.length === 0
    ) {
      closeModal();
    }
  }, [ownedSessions.length, resumeSessionIds.length, stage, closeModal]);

  const runUpload = async (
    sessionId: string,
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
    signals: (AbortSignal | undefined)[],
    isAborted: () => boolean,
  ) => {
    if (!clientProfileId) {
      return;
    }

    try {
      await uploadDocuments({
        clientProfileId,
        // Each file carries its own abort signal so per-file cancel works.
        documents: files.map((file, index) => ({
          ...file,
          signal: signals[index],
        })),
        namespace,
        onManifest: (manifest) => setUploadManifest(sessionId, manifest),
        onProgress: (progress) => updateUpload(sessionId, progress),
      });

      if (isAborted()) {
        // Every file was cancelled; the pipeline skipped them. Nothing was
        // saved, so don't report success.
        endUpload(sessionId);
        if (isMountedRef.current) {
          closeModal();
        }
        return;
      }

      completeUpload(sessionId);
      if (!isMountedRef.current) {
        // Finished in the background: surface confirmation where the user is
        // (the root-level snackbar survives navigation).
        showSnackbar({ message: 'Upload complete', type: 'success' });
      }
    } catch (err) {
      console.error(`[UploadStage upload error:] ${err}`);

      if (isAborted()) {
        endUpload(sessionId);
        if (isMountedRef.current) {
          closeModal();
        }
        return;
      }

      failUpload(sessionId, 'Upload failed. Use Retry on the file below.');
      if (!isMountedRef.current) {
        showSnackbar({
          message: 'Upload failed. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const startSession = (
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
    title: string,
  ) => {
    const handle = begin(
      files.map((file) => file.name),
      {
        label: title,
        clientId: clientProfileId,
        groupId,
        // Retrying a failed item re-runs only that file in a fresh session;
        // the successful files were already persisted and stay untouched.
        onRetryItem: (index) => startSession([files[index]], namespace, title),
      },
    );

    setStage('uploading');
    void runUpload(
      handle.id,
      files,
      namespace,
      handle.signals,
      handle.isAborted,
    );
  };

  const cancelAll = () => {
    for (const session of ownedSessions) {
      for (const item of [...session.items]) {
        cancelUploadItem(session.id, item.refId);
      }
    }
    closeModal();
  };

  const insets = useSafeAreaInsets();

  if (stage === 'ready') {
    const files = selection?.files ?? [];

    return (
      <View
        style={[styles.container, { paddingTop: insets.top + Spacings.xs }]}
      >
        <TextBold size="lg">Ready to upload</TextBold>
        <TextRegular size="xs" color={Colors.NEUTRAL}>
          Review the files below. Nothing is uploaded until you confirm.
        </TextRegular>

        <ScrollView style={styles.list}>
          <View style={styles.listContent}>
            {files.map((file, index) => (
              <View key={`${file.name}-${index}`} style={styles.readyRow}>
                <FileOutlineIcon size="sm" color={Colors.NEUTRAL_DARK} />
                <TextRegular
                  numberOfLines={1}
                  size="sm"
                  style={styles.fileName}
                >
                  {file.name}
                </TextRegular>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TextButton
            title="Cancel"
            fontSize="md"
            onPress={closeModal}
            accessibilityHint="Closes without uploading"
          />
          <Button
            title="Upload"
            variant="primary"
            onPress={() =>
              selection &&
              startSession(
                selection.files,
                selection.namespace,
                selection.title,
              )
            }
            accessibilityHint="Starts uploading the selected files"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacings.xs }]}>
      <TextBold size="lg">
        {stage === 'done'
          ? anyFailed
            ? 'Upload failed'
            : 'Upload complete'
          : 'Uploading…'}
      </TextBold>
      <TextRegular size="xs" color={Colors.NEUTRAL}>
        {stage === 'done'
          ? anyFailed
            ? 'Some files did not upload. Retry below or close this screen.'
            : 'Files are saved to the Doc Library.'
          : 'You can leave this screen — uploads continue in the background.'}
      </TextRegular>

      <ScrollView style={styles.list}>
        <View style={styles.listContent}>
          {ownedSessions.map((session) => (
            <View key={session.id} style={styles.session}>
              {session.errorMessage ? (
                <TextRegular
                  size="xs"
                  color={Colors.ERROR}
                  style={styles.errorMessage}
                >
                  {session.errorMessage}
                </TextRegular>
              ) : null}

              {session.items.map((item) => (
                <UploadItemRow
                  key={item.refId}
                  filename={item.name}
                  status={item.status}
                  progressPct={uploadProgressPct(item)}
                  onCancel={() => cancelUploadItem(session.id, item.refId)}
                  onRetry={
                    item.status === 'error' && item.onRetry
                      ? () => retryUploadItem(session.id, item.refId)
                      : undefined
                  }
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {stage === 'uploading' ? (
          <TextButton
            title="Cancel upload"
            fontSize="md"
            onPress={cancelAll}
            accessibilityHint="Cancels all remaining uploads"
          />
        ) : (
          <Button
            title="Done"
            variant="primary"
            onPress={closeModal}
            accessibilityHint="Closes the upload screen"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    gap: Spacings.xs,
  },
  list: {
    flex: 1,
    marginTop: Spacings.xs,
  },
  listContent: {
    gap: Spacings.xs,
    paddingBottom: Spacings.lg,
  },
  session: {
    gap: Spacings.xs,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  fileName: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: Spacings.xxs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingBottom: Spacings.md,
  },
});
