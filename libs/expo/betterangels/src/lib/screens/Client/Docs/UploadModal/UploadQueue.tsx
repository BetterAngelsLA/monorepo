import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { TUploadSession } from '../../../../providers';

type TUploadQueueProps = {
  sessions: TUploadSession[];
  onCancel: (sessionId: string) => void;
  onRetry: (sessionId: string) => void;
  onDismiss: (sessionId: string) => void;
};

function sessionState(session: TUploadSession): {
  label: string;
  color: string;
  active: boolean;
  failed: boolean;
} {
  const failed =
    session.failed || session.items.some((item) => item.status === 'error');

  if (failed) {
    return { label: 'Failed', color: Colors.ERROR, active: false, failed: true };
  }

  if (session.complete) {
    return {
      label: 'Complete',
      color: Colors.SUCCESS,
      active: false,
      failed: false,
    };
  }

  return {
    label: `${session.completed} of ${session.total}`,
    color: Colors.PRIMARY,
    active: true,
    failed: false,
  };
}

/**
 * Lists the in-flight uploads started from the upload modal so the user can
 * queue several documents, watch their status, retry failures, and dismiss
 * completed ones before leaving the screen.
 */
export function UploadQueue(props: TUploadQueueProps) {
  const { sessions, onCancel, onRetry, onDismiss } = props;

  if (!sessions.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <TextBold size="sm">Uploading</TextBold>

      <View style={styles.list}>
        {sessions.map((session) => {
          const state = sessionState(session);
          const percent = session.total
            ? (session.completed / session.total) * 100
            : 0;

          return (
            <View key={session.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <TextRegular
                  size="sm"
                  numberOfLines={1}
                  style={styles.name}
                >
                  {session.label ?? session.items[0]?.name ?? 'Upload'}
                </TextRegular>
                <TextRegular size="xs" color={state.color}>
                  {state.label}
                </TextRegular>
              </View>

              {state.active && (
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${percent}%` }]} />
                </View>
              )}

              {state.failed && session.errorMessage ? (
                <TextRegular size="xs" color={Colors.ERROR}>
                  {session.errorMessage}
                </TextRegular>
              ) : null}

              <View style={styles.actions}>
                {state.failed ? (
                  <TextButton
                    title="Retry"
                    onPress={() => onRetry(session.id)}
                    accessibilityHint="Retries the failed upload"
                  />
                ) : state.active ? (
                  <TextButton
                    title="Cancel"
                    onPress={() => onCancel(session.id)}
                    accessibilityHint="Cancels this upload"
                  />
                ) : (
                  <TextButton
                    title="Close"
                    onPress={() => onDismiss(session.id)}
                    accessibilityHint="Dismisses the completed upload"
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
        Uploads continue in the background — you can close this screen.
      </TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacings.xs,
    marginBottom: Spacings.lg,
  },
  list: {
    gap: Spacings.sm,
  },
  row: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    gap: Spacings.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.xs,
  },
  name: {
    flex: 1,
  },
  bar: {
    height: 6,
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radiuses.xxxs,
    backgroundColor: Colors.PRIMARY,
  },
  actions: {
    alignItems: 'flex-end',
  },
});
