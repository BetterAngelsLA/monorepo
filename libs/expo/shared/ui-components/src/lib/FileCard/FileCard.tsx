import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export type TFileCardStatus = 'pending' | 'uploading' | 'done' | 'error';

const STATUS_LABELS: Record<TFileCardStatus, string> = {
  pending: 'Queued',
  uploading: 'Uploading…',
  done: 'Done',
  error: 'Failed',
};

const STATUS_COLORS: Record<TFileCardStatus, string> = {
  pending: Colors.NEUTRAL,
  uploading: Colors.PRIMARY,
  done: Colors.SUCCESS,
  error: Colors.ERROR,
};

interface IFileCardProps {
  onPress?: () => void;
  thumbnail?: ReactNode;
  filename?: string | null;
  url?: string;
  createdAt?: string | null;
  /**
   * 0-100 progress for an in-flight upload. When `status` is set the row
   * renders as an upload row (not pressable) with a progress bar, a status
   * label, and optional Cancel/Retry actions instead of the created date.
   */
  progressPct?: number | null;
  status?: TFileCardStatus;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function FileCard(props: IFileCardProps) {
  const {
    onPress,
    url,
    filename,
    createdAt,
    thumbnail,
    progressPct,
    status,
    onCancel,
    onRetry,
  } = props;

  const isUpload = status != null;
  const cancellable =
    !!onCancel && (status === 'pending' || status === 'uploading');
  const showProgress = isUpload && status === 'uploading' && progressPct != null;
  const pct = showProgress
    ? Math.min(100, Math.round(progressPct ?? 0))
    : null;

  const content = (
    <>
      <View style={styles.leading}>
        <View style={styles.thumbnail}>
          {!!thumbnail && thumbnail}
          {!thumbnail && url ? (
            <Image
              style={{ width: 36, height: 36 }}
              source={{ uri: url }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : null}
        </View>
        <View style={styles.meta}>
          <TextRegular numberOfLines={1} size="sm">
            {filename}
          </TextRegular>
          {isUpload && pct != null ? (
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${pct}%` }]}
              />
            </View>
          ) : null}
        </View>
      </View>

      {isUpload ? (
        <View style={styles.actions}>
          {pct != null ? (
            <TextRegular size="xs" color={Colors.PRIMARY}>
              {pct}%
            </TextRegular>
          ) : (
            <TextRegular size="xs" color={STATUS_COLORS[status]}>
              {STATUS_LABELS[status]}
            </TextRegular>
          )}

          {cancellable && (
            <TextButton
              title="Cancel"
              fontSize="sm"
              onPress={onCancel}
              accessibilityHint={`Cancels upload of ${filename ?? 'file'}`}
            />
          )}

          {status === 'error' && onRetry && (
            <TextButton
              title="Retry"
              fontSize="sm"
              onPress={onRetry}
              accessibilityHint={`Retries upload of ${filename ?? 'file'}`}
            />
          )}
        </View>
      ) : createdAt ? (
        <TextRegular ellipsizeMode="tail" size="xs" color={Colors.NEUTRAL_DARK}>
          {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      ) : null}
    </>
  );

  if (isUpload) {
    return (
      <View
        style={styles.row}
        accessibilityRole="summary"
        accessibilityLabel="Upload progress"
        accessibilityHint="Shows the status of the current file upload"
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityHint="opens document modal"
      accessibilityLabel="open document modal"
    >
      {content}
    </Pressable>
  );
}

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
  pressed: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
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
