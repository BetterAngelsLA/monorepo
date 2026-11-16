import { ShareIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import {
  findNodeHandle,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSnackbar } from '../../hooks';
import { HeaderSlot } from '../../navigation';
import { shareTask, type ShareableTask } from './shareTask';

// 44 is the iOS minimum touch target and above Material's 40 dp icon button.
const TOUCH_TARGET = 44;

// Only one system share sheet can be presented at a time, so the lock is
// module-level rather than per-component.
let shareSheetOpen = false;

export function ShareTaskButton({ task }: { task: ShareableTask }) {
  const { showSnackbar } = useSnackbar();
  const [sharing, setSharing] = useState(false);

  const onPress = async (event: GestureResponderEvent) => {
    if (shareSheetOpen) return;
    shareSheetOpen = true;
    setSharing(true);

    try {
      // iPad presents the sheet as a popover. `currentTarget` is the
      // Pressable's host instance; findNodeHandle's type omits host instances,
      // but it resolves one at runtime, so no ref is needed.
      const anchor =
        Platform.OS === 'ios'
          ? (findNodeHandle(event.currentTarget as never) ?? undefined)
          : undefined;
      const outcome = await shareTask(task, anchor);

      if (outcome === 'copied') {
        showSnackbar({ message: 'Link copied', type: 'success' });
      }
    } catch {
      console.error('share_task_failed', { taskId: task.id });
      showSnackbar({ message: "Couldn't share this task", type: 'error' });
    } finally {
      shareSheetOpen = false;
      setSharing(false);
    }
  };

  return (
    <HeaderSlot side="right">
      <Pressable
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
