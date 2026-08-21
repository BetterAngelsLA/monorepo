import { FileOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

/**
 * Canonical status union for an in-flight upload item. The app's upload
 * store mirrors this type (see `TUploadItemStatus` in the upload progress
 * lib) so row state and store state cannot drift apart.
 *
 * `uploaded` and `done` are deliberately distinct: a file's bytes reaching
 * S3 does not mean it was persisted. Only the pipeline's save step turns an
 * `uploaded` item into `done`, so a batch that dies before saving cannot
 * show green rows for files that were never recorded.
 */
export type TUploadItemRowStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'done'
  | 'error';

const STATUS_LABELS: Record<TUploadItemRowStatus, string> = {
  pending: 'Queued',
  uploading: 'Uploading…',
  uploaded: 'Saving…',
  done: 'Done',
  error: 'Failed',
};

const STATUS_COLORS: Record<TUploadItemRowStatus, string> = {
  pending: Colors.NEUTRAL,
  uploading: Colors.PRIMARY,
  uploaded: Colors.PRIMARY,
  done: Colors.SUCCESS,
  error: Colors.ERROR,
};

interface IUploadItemRowProps {
  filename: string;
  status: TUploadItemRowStatus;
  /** 0-100 progress for an uploading file; renders a progress bar. */
  progressPct?: number | null;
  thumbnail?: ReactNode;
  /**
   * Removes the file from its session: aborts it while in flight, and
   * dismisses it once it has failed. A failed row needs this — without it a
   * file that keeps failing can never be cleared, which pins the global
   * progress bar in its error state forever.
   */
  onCancel?: () => void;
  /** Present to allow re-running a failed file. */
  onRetry?: () => void;
}

/**
 * Standalone row for a single in-flight upload: filename, status, progress
 * bar + percentage, and per-item Cancel/Retry. Domain-agnostic on purpose —
 * it does not depend on any document/file-row component.
 */
export function UploadItemRow(props: IUploadItemRowProps) {
  const { filename, status, progressPct, thumbnail, onCancel, onRetry } = props;

  const cancellable =
    !!onCancel &&
    (status === 'pending' || status === 'uploading' || status === 'error');
  // Aborting work in flight and clearing a settled failure are different
  // enough acts to name differently.
  const cancelTitle = status === 'error' ? 'Dismiss' : 'Cancel';
  const pct =
    status === 'uploading' && progressPct != null
      ? Math.min(100, Math.round(progressPct))
      : null;
  const statusLabel = pct != null ? `${pct}%` : STATUS_LABELS[status];

  return (
    <View style={styles.row}>
      {/*
       * `accessible` belongs on the status block, not the row: on iOS it
       * collapses everything beneath it into one element, which made the
       * Cancel/Retry buttons unreachable by VoiceOver.
       */}
      <View
        style={styles.leading}
        accessible
        accessibilityLabel={`${filename}, ${statusLabel}`}
        accessibilityHint="Shows the status of this file's upload"
      >
        <View style={styles.thumbnail}>
          {!!thumbnail && thumbnail}
          {!thumbnail && (
            <FileOutlineIcon size="sm" color={Colors.NEUTRAL_DARK} />
          )}
        </View>
        <View style={styles.meta}>
          <TextRegular numberOfLines={1} size="sm">
            {filename}
          </TextRegular>
          {pct != null ? (
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {pct != null ? (
          <TextRegular size="xs" color={Colors.PRIMARY}>
            {pct}%
          </TextRegular>
        ) : (
          <TextRegular size="xs" color={STATUS_COLORS[status]}>
            {statusLabel}
          </TextRegular>
        )}

        {cancellable && (
          <TextButton
            title={cancelTitle}
            fontSize="sm"
            onPress={onCancel}
            accessibilityHint={
              status === 'error'
                ? `Dismisses the failed upload of ${filename}`
                : `Cancels upload of ${filename}`
            }
          />
        )}

        {status === 'error' && onRetry && (
          <TextButton
            title="Retry"
            fontSize="sm"
            onPress={onRetry}
            accessibilityHint={`Retries upload of ${filename}`}
          />
        )}
      </View>
    </View>
  );
}

export default UploadItemRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radiuses.xs,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    gap: Spacings.xs,
    backgroundColor: Colors.WHITE,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    overflow: 'hidden',
    flex: 1,
  },
  thumbnail: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  meta: {
    flex: 1,
    gap: Spacings.xxs,
  },
  barTrack: {
    height: 4,
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.PRIMARY,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
});
