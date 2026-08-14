import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  TextBold,
  TextRegular,
  UploadItemRow,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  setUploadStageVisible,
  uploadProgressPct,
  useUploadProgress,
} from '../../../../providers';
import { FileThumbnail } from '../../../../ui-components';

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

  const { sessions, cancelUploadItem, retryUploadItem } = useUploadProgress();

  const [stage, setStage] = useState<TStage>('uploading');

  const resumeIdsRef = useRef<string[]>(resumeSessionIds);
  const hasShownSessionsRef = useRef(false);

  // Hide the global progress bar while this detail view is open.
  useEffect(() => {
    setUploadStageVisible(true);
    return () => setUploadStageVisible(false);
  }, []);

  // Sessions shown here: everything sharing the resumed sessions' group id
  // (including retry replacement sessions). Sessions without a group id
  // fall back to the explicitly resumed ids.
  const [groupId] = useState(() => {
    const resumed = sessions.find((session) =>
      resumeSessionIds.includes(session.id),
    );
    return resumed?.groupId;
  });

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
});
