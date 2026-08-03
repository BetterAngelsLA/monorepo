import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { last } from 'remeda';
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

/**
 * Bottom drawer that shows the progress of the most recent upload session:
 * stage label, x-of-y counter, a progress bar, and per-file status rows.
 * Rendered by UploadProgressProvider so it appears above modals.
 */
export function UploadProgressDrawer() {
  const { sessions, cancelUpload, endUpload } = useUploadProgress();

  const latest = last(sessions);
  const failed = latest
    ? latest.failed || latest.items.some((item) => item.status === 'error')
    : false;
  const complete = !failed && !!latest?.complete;
  const terminal = failed || complete;

  // Swipe down on the card to dismiss a terminal (complete/failed) session;
  // active sessions keep the explicit Cancel control.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => terminal && gesture.dy > 8,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 60 && latest) {
            endUpload(latest.id);
          }
        },
      }),
    [terminal, latest, endUpload],
  );

  if (!sessions.length) {
    return null;
  }

  const session = sessions[sessions.length - 1];
  const percent = session.total ? (session.completed / session.total) * 100 : 0;
  const stateLabel = failed
    ? 'Upload failed'
    : complete
    ? 'Upload complete'
    : STAGE_LABELS[session.stage];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={styles.card}
        {...panResponder.panHandlers}
        accessibilityRole="summary"
        accessibilityLabel="Upload progress"
        accessibilityHint="Shows the status of the current file upload"
      >
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <TextBold
            size="sm"
            color={failed ? Colors.ERROR : complete ? Colors.SUCCESS : undefined}
          >
            {session.label ? `${session.label} · ${stateLabel}` : stateLabel}
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
                  <View style={styles.itemStatus}>
                    <TextRegular
                      size="xs"
                      color={STATUS_COLORS[item.status]}
                    >
                      {STATUS_LABELS[item.status]}
                    </TextRegular>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.cancelRow}>
          {failed ? (
            <View style={styles.failedActions}>
              {session.onRetry ? (
                <TextButton
                  title="Retry"
                  onPress={() => {
                    endUpload(session.id);
                    session.onRetry?.();
                  }}
                  accessibilityHint="Retries the failed upload"
                />
              ) : null}
              <TextButton
                title="Close"
                onPress={() => endUpload(session.id)}
                accessibilityHint="Closes the upload progress panel"
              />
            </View>
          ) : complete ? (
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
    // Fixed height so the row does not resize when an item finishes and the
    // progress block is replaced by its status label.
    height: Spacings.md,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: Spacings.xxs,
  },
  itemStatus: {
    // Matches itemProgress so rows keep a stable height through completion.
    height: Spacings.md,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
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
  failedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  errorMessage: {
    marginTop: Spacings.xxs,
  },
});
