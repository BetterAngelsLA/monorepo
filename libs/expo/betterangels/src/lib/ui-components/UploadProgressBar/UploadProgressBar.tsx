import { useAtomValue } from 'jotai';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FileOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import UploadStage from '../../screens/Client/Docs/UploadStage/UploadStage';
import { useModalScreen } from '../../providers';
import {
  aggregateUploadCounts,
  TUploadSession,
  uploadSessionsAtom,
  uploadStageVisibleAtom,
} from '../../providers/uploadProgress';

/**
 * In-flow upload progress bar (WhatsApp-style): a slim strip rendered by
 * each screen between its header and content while uploads run in the
 * background. Tapping it re-opens the upload screen for the in-flight
 * sessions.
 *
 * Hidden while the upload screen itself is open (per-file progress is
 * already visible there).
 */
export function UploadProgressBar() {
  const sessions = useAtomValue(uploadSessionsAtom);
  const uploadStageVisible = useAtomValue(uploadStageVisibleAtom);

  const activeSessions = sessions.filter((session) => !session.complete);

  if (uploadStageVisible || activeSessions.length === 0) {
    return null;
  }

  return <UploadProgressBarContent sessions={activeSessions} />;
}

function UploadProgressBarContent({
  sessions,
}: {
  sessions: TUploadSession[];
}) {
  const { showModalScreen } = useModalScreen();

  const { totalItems, completedItems, failed } =
    aggregateUploadCounts(sessions);
  const pct =
    totalItems > 0
      ? Math.min(100, Math.round((completedItems / totalItems) * 100))
      : 0;
  const label = failed
    ? 'Upload failed — tap to review'
    : `Uploading ${completedItems} of ${totalItems} files…`;

  const resumeSessionIds = sessions.map((session) => session.id);

  const openUploadStage = () => {
    showModalScreen({
      presentation: 'fullScreenModal',
      title: 'Uploads',
      renderContent: ({ close }) => (
        <UploadStage closeModal={close} resumeSessionIds={resumeSessionIds} />
      ),
    });
  };

  return (
    <Pressable
      style={styles.bar}
      onPress={openUploadStage}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens the upload screen"
    >
      <View style={styles.row}>
        {failed ? (
          <FileOutlineIcon size="sm" color={Colors.ERROR} />
        ) : (
          <ActivityIndicator size="small" color={Colors.PRIMARY} />
        )}
        <TextRegular
          size="sm"
          numberOfLines={1}
          style={styles.label}
          color={failed ? Colors.ERROR : Colors.NEUTRAL_DARK}
        >
          {label}
        </TextRegular>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              backgroundColor: failed ? Colors.ERROR : Colors.PRIMARY,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
  },
  label: {
    flex: 1,
  },
  track: {
    height: 3,
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radiuses.xxxs,
  },
});
