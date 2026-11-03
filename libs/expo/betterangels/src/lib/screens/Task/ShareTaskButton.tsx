import { ShareIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import {
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSnackbar } from '../../hooks';
import { HeaderSlot } from '../../navigation';
import { shareTask, type ShareableTask } from './shareTask';

// 44 is the iOS minimum touch target and above Material's 40 dp icon button.
const TOUCH_TARGET = 44;

export function ShareTaskButton({ task }: { task: ShareableTask }) {
  const { showSnackbar } = useSnackbar();
  // Two overlapping Share.share calls reject on iOS ("already presenting").
  const busy = useRef(false);
  const anchorRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const onPress = async () => {
    if (busy.current) return;
    busy.current = true;
    setSharing(true);

    try {
      // iPad presents the sheet as a popover and needs a source view.
      const anchor =
        Platform.OS === 'ios'
          ? (findNodeHandle(anchorRef.current) ?? undefined)
          : undefined;
      const outcome = await shareTask(task, anchor);

      if (outcome === 'copied') {
        showSnackbar({ message: 'Link copied', type: 'success' });
      }
    } catch {
      console.error('share_task_failed', { taskId: task.id });
      showSnackbar({ message: "Couldn't share this task", type: 'error' });
    } finally {
      busy.current = false;
      setSharing(false);
    }
  };

  return (
    <HeaderSlot side="right">
      <Pressable
        ref={anchorRef}
        testID="share-task"
        accessibilityRole="button"
        accessibilityLabel="Share task"
        accessibilityHint="Opens the system share sheet"
        accessibilityState={{ disabled: sharing }}
        disabled={sharing}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          sharing && styles.busy,
        ]}
      >
        <ShareIcon size="lg" color={Colors.WHITE} />
      </Pressable>
    </HeaderSlot>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  busy: {
    opacity: 0.6,
  },
});
