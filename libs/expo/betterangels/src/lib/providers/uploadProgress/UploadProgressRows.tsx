import { FileOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { FileCard, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
  TUploadItem,
  TUploadSession,
  useUploadProgress,
} from './UploadProgressContext';

/** 0-100 progress percentage for an in-flight item, or null when unknown. */
export function uploadProgressPct(item: TUploadItem): number | null {
  if (
    item.status !== 'uploading' ||
    typeof item.totalBytes !== 'number' ||
    item.totalBytes <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.round(((item.bytesSent ?? 0) / item.totalBytes) * 100),
  );
}

/**
 * In-flight rows for a set of upload sessions, rendered as FileCard rows (the
 * same component used for completed files). One row per item with live
 * progress, status, and Cancel/Retry wired to the upload store.
 */
export function UploadProgressRows({
  sessions,
}: {
  sessions: TUploadSession[];
}) {
  const { cancelUploadItem, retryUploadItem } = useUploadProgress();

  if (sessions.length === 0) {
    return null;
  }

  return (
    <>
      {sessions.map((session) => (
        <View key={session.id} style={styles.group}>
          {session.errorMessage ? (
            <TextRegular
              size="xs"
              color={Colors.ERROR}
              style={styles.errorMessage}
            >
              {session.errorMessage}
            </TextRegular>
          ) : null}

          {session.items.map((item) => {
            const cancellable =
              !!item.onCancel &&
              (item.status === 'pending' || item.status === 'uploading');

            return (
              <FileCard
                key={item.refId}
                filename={item.name}
                status={item.status}
                progressPct={uploadProgressPct(item)}
                thumbnail={
                  <View style={styles.thumbnail}>
                    <FileOutlineIcon size="sm" color={Colors.NEUTRAL_DARK} />
                  </View>
                }
                onCancel={
                  cancellable
                    ? () => cancelUploadItem(session.id, item.refId)
                    : undefined
                }
                onRetry={
                  item.status === 'error' && item.onRetry
                    ? () => retryUploadItem(session.id, item.refId)
                    : undefined
                }
              />
            );
          })}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacings.xs,
  },
  errorMessage: {
    marginBottom: Spacings.xxs,
  },
  thumbnail: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
});
