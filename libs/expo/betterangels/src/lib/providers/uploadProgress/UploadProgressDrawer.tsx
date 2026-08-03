import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
  TUploadItemStatus,
  TUploadSession,
  useUploadProgress,
} from './UploadProgressContext';

const STAGE_LABELS: Record<TUploadSession['stage'], string> = {
  GENERATING: 'Preparing upload…',
  UPLOADING: 'Uploading…',
  SAVING: 'Saving…',
};

const STATUS_LABELS: Record<TUploadItemStatus, string> = {
  pending: 'Queued',
  uploading: 'Uploading…',
  done: 'Done',
  error: 'Failed',
};

const STATUS_COLORS: Record<TUploadItemStatus, string> = {
  pending: Colors.NEUTRAL,
  uploading: Colors.PRIMARY,
  done: Colors.SUCCESS,
  error: Colors.ERROR,
};

type TUploadProgressDrawerProps = {
  sessions: TUploadSession[];
};

/**
 * Bottom drawer that shows the progress of the most recent upload session:
 * stage label, x-of-y counter, a progress bar, and per-file status rows.
 * Rendered by UploadProgressProvider so it appears above modals.
 */
export function UploadProgressDrawer(props: TUploadProgressDrawerProps) {
  const { sessions } = props;
  const { cancelUpload, endUpload } = useUploadProgress();

  if (!sessions.length) {
    return null;
  }

  const session = sessions[sessions.length - 1];
  const failed =
    session.failed || session.items.some((item) => item.status === 'error');
  const percent = session.total ? (session.completed / session.total) * 100 : 0;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel="Upload progress"
        accessibilityHint="Shows the status of the current file upload"
      >
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <TextBold size="sm" color={failed ? Colors.ERROR : undefined}>
            {failed ? 'Upload failed' : STAGE_LABELS[session.stage]}
          </TextBold>
          <TextRegular size="sm">
            {session.completed} of {session.total}
          </TextRegular>
        </View>

        {failed && session.errorMessage ? (
          <TextRegular
            size="xs"
            color={Colors.ERROR}
            style={styles.errorMessage}
          >
            {session.errorMessage}
          </TextRegular>
        ) : null}

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>

        {session.items.length > 1 && (
          <View style={styles.items}>
            {session.items.map((item) => (
              <View key={item.refId} style={styles.itemRow}>
                <TextRegular
                  size="xs"
                  numberOfLines={1}
                  style={styles.itemName}
                >
                  {item.name}
                </TextRegular>

                {item.status === 'uploading' &&
                typeof item.totalBytes === 'number' &&
                item.totalBytes > 0 ? (
                  <View style={styles.itemProgress}>
                    <TextRegular size="xs" color={Colors.PRIMARY}>
                      {Math.round(
                        ((item.bytesSent ?? 0) / item.totalBytes) * 100,
                      )}
                      %
                    </TextRegular>
                    <View style={styles.itemBar}>
                      <View
                        style={[
                          styles.itemBarFill,
                          {
                            width: `${Math.min(
                              100,
                              ((item.bytesSent ?? 0) / item.totalBytes) * 100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ) : (
                  <TextRegular size="xs" color={STATUS_COLORS[item.status]}>
                    {STATUS_LABELS[item.status]}
                  </TextRegular>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.cancelRow}>
          {failed ? (
            <TextButton
              title="Close"
              onPress={() => endUpload(session.id)}
              accessibilityHint="Closes the upload progress panel"
            />
          ) : session.onCancel ? (
            <TextButton
              title="Cancel upload"
              onPress={() => cancelUpload(session.id)}
              accessibilityHint="Cancels the current upload"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacings.md,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.sm,
    padding: Spacings.md,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radiuses.xxs,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginBottom: Spacings.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacings.xs,
  },
  bar: {
    height: 6,
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.PRIMARY,
  },
  items: {
    marginTop: Spacings.sm,
    gap: Spacings.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    marginRight: Spacings.sm,
  },
  itemProgress: {
    alignItems: 'flex-end',
    gap: Spacings.xxs,
  },
  itemBar: {
    width: 64,
    height: 4,
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    overflow: 'hidden',
  },
  itemBarFill: {
    height: '100%',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.PRIMARY,
  },
  cancelRow: {
    marginTop: Spacings.md,
    alignItems: 'flex-end',
  },
  errorMessage: {
    marginTop: Spacings.xxs,
  },
});
