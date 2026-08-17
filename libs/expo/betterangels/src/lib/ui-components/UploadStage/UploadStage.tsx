import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  TextBold,
  TextButton,
  TextRegular,
  UploadItemRow,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  setUploadStageVisible,
  uploadProgressPct,
  uploadSessionCounts,
  useUploadProgress,
} from '../../providers';
// Imported by path, not through the ui-components barrel: the barrel also
// exports UploadProgressBar, which imports this file.
import { FileThumbnail } from '../FileThumbnail/FileThumbnail';

type TUploadStageProps = {
  closeModal: () => void;
  /**
   * Background sessions to show (opened from the global progress bar). The
   * stage derives live item state from the store, so it works after
   * remounting, including retry replacement sessions.
   */
  resumeSessionIds: string[];
};

type TStage = 'uploading' | 'done';

/**
 * Detail view for in-flight uploads, opened from the global progress bar.
 * Uploads start immediately when files are picked (no confirmation step);
 * this screen shows per-file progress, Cancel, and Retry — actions are
 * strictly per-file, there is no global cancel. It stays open until the
 * user closes it (X in the modal header) or until every file has been
 * cancelled individually. Closing mid-upload leaves the sessions running;
 * the progress bar picks them back up.
 */
export default function UploadStage(props: TUploadStageProps) {
  const { closeModal, resumeSessionIds } = props;

  const {
    sessions,
    cancelUploadItem,
    retryUploadItems,
    dismissFailedUploadItems,
  } = useUploadProgress();

  const [stage, setStage] = useState<TStage>('uploading');

  const hasShownSessionsRef = useRef(false);

  // Hide the global progress bar while this detail view is open.
  useEffect(() => {
    setUploadStageVisible(true);
    return () => setUploadStageVisible(false);
  }, []);

  // Exactly the sessions the progress bar counted when it opened this
  // screen, so the bar's "Uploading 2 of 6" and this screen can never
  // disagree. Retry is in-place, so this set is stable for the life of the
  // screen — there are no replacement sessions to chase, and no group to
  // scope by (which used to silently hide concurrent uploads).
  const [resumeIds] = useState(() => resumeSessionIds);
  const ownedSessions = useMemo(
    () => sessions.filter((session) => resumeIds.includes(session.id)),
    [sessions, resumeIds],
  );

  const counts = useMemo(
    () => ownedSessions.map(uploadSessionCounts),
    [ownedSessions],
  );

  const allComplete =
    counts.length > 0 && counts.every((count) => count.complete);
  const anyInFlight = counts.some(
    (count) => !count.complete && !count.failed,
  );
  const anyFailed = counts.some((count) => count.failed);

  // Failed items across every shown session, so one tap can re-run them all
  // in one transport run each instead of forcing a tap (and a full
  // generate/upload/save/refetch cycle) per file.
  const failedBySession = useMemo(
    () =>
      ownedSessions
        .map((session) => ({
          id: session.id,
          refIds: session.items
            .filter((item) => item.status === 'error')
            .map((item) => item.refId),
        }))
        .filter((entry) => entry.refIds.length > 0),
    [ownedSessions],
  );

  const failedCount = failedBySession.reduce(
    (total, entry) => total + entry.refIds.length,
    0,
  );

  const retryAll = () =>
    failedBySession.forEach((entry) => retryUploadItems(entry.id, entry.refIds));

  const dismissAllFailed = () =>
    failedBySession.forEach((entry) => dismissFailedUploadItems(entry.id));

  // Stage transitions driven by session state (so the screen reacts to
  // sessions that finish or fail while it is open):
  //   all complete → Done; anything in flight → Uploading;
  //   everything settled with failures → Done (Retry affordance stays).
  useEffect(() => {
    if (ownedSessions.length === 0) {
      return;
    }

    if (allComplete && stage !== 'done') {
      setStage('done');
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

  // Resumed sessions may have been cleaned up before this screen opened;
  // in that case there is nothing to show, so close. Once sessions have
  // been shown, they only become empty when every file has been cancelled
  // one-by-one (completed sessions are kept by the cleanup while the stage
  // is open) — at that point there is nothing left to display, so close.
  useEffect(() => {
    if (ownedSessions.length > 0) {
      hasShownSessionsRef.current = true;
      return;
    }

    if (hasShownSessionsRef.current || resumeSessionIds.length > 0) {
      closeModal();
    }
  }, [ownedSessions.length, resumeSessionIds.length, closeModal]);

  const insets = useSafeAreaInsets();

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
          : // Deliberately "while the app is open", not "in the background":
            // Android has no background upload continuation, and even on iOS
            // a terminated app loses the save step. Promising more than that
            // would be a lie on most devices.
            'You can leave this screen — uploads continue while the app is open.'}
      </TextRegular>

      {failedCount > 0 && (
        <View style={styles.bulkActions}>
          {failedCount > 1 && (
            <TextButton
              title={`Retry all ${failedCount} failed files`}
              fontSize="sm"
              onPress={retryAll}
              accessibilityHint="Retries every file that failed to upload"
            />
          )}
          <TextButton
            title="Dismiss failed"
            fontSize="sm"
            onPress={dismissAllFailed}
            accessibilityHint="Clears the files that failed to upload"
          />
        </View>
      )}

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
                  thumbnail={
                    item.uri && item.mimeType ? (
                      <FileThumbnail
                        uri={item.uri}
                        mimeType={item.mimeType}
                        thumbnailSize={{ width: 36, height: 36 }}
                        borderRadius={Radiuses.xxxs}
                      />
                    ) : undefined
                  }
                  onCancel={() => cancelUploadItem(session.id, item.refId)}
                  onRetry={
                    item.status === 'error' && session.onRetryItems
                      ? () => retryUploadItems(session.id, [item.refId])
                      : undefined
                  }
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
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
  errorMessage: {
    marginBottom: Spacings.xxs,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
});
