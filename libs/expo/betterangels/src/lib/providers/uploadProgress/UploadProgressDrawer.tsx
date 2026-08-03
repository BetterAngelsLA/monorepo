import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomSheetPanel,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
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

function isFailed(session: TUploadSession): boolean {
  return session.failed || session.items.some((item) => item.status === 'error');
}

/**
 * Progress card shown inside the bottom sheet panel.
 *
 * It reads the latest session straight from the upload context (the drawer is
 * rendered by UploadProgressProvider, so the context is available here), which
 * keeps the progress bar and per-file rows live as the session updates.
 */
function UploadProgressCard({ session }: { session: TUploadSession }) {
  const { cancelUpload, endUpload } = useUploadProgress();

  const failed = isFailed(session);
  const complete = !failed && !!session.complete;
  const percent = session.total ? (session.completed / session.total) * 100 : 0;
  const stateLabel = failed
    ? 'Upload failed'
    : complete
    ? 'Upload complete'
    : STAGE_LABELS[session.stage];

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="Upload progress"
      accessibilityHint="Shows the status of the current file upload"
    >
      <View style={styles.headerRow}>
        <TextBold
          size="sm"
          color={
            failed ? Colors.ERROR : complete ? Colors.SUCCESS : undefined
          }
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
  );
}

/**
 * Bottom drawer that shows the progress of the most recent upload session.
 *
 * Rendered in the app's BottomSheetPanel — a non-modal Gorhom sheet — so the
 * card stays passive (the screen behind remains interactive) while getting
 * real swipe-down behavior:
 * - Active sessions can't be swiped away (pan-down disabled; Cancel is the
 *   control).
 * - Terminal (complete/failed) sessions are dismissed by swiping down or with
 *   the Close action.
 */
export function UploadProgressDrawer() {
  const { sessions, endUpload } = useUploadProgress();

  const session = last(sessions);

  if (!session) {
    return null;
  }

  const terminal = isFailed(session) || !!session.complete;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <BottomSheetPanel
        index={0}
        enableDynamicSizing
        enablePanDownToClose={terminal}
        onClose={terminal ? () => endUpload(session.id) : undefined}
      >
        <UploadProgressCard session={session} />
      </BottomSheetPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    paddingHorizontal: Spacings.sm,
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
