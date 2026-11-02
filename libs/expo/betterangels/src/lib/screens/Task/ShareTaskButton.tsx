import { ShareIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSnackbar } from '../../hooks';
import { HeaderSlot } from '../../navigation';
import { shareTask, type ShareableTask } from './shareTask';

// 44 is the iOS minimum touch target and above Material's 40 dp icon button.
const TOUCH_TARGET = 44;

export function ShareTaskButton({ task }: { task: ShareableTask }) {
  const { showSnackbar } = useSnackbar();
  // The sheet is not instant; a second tap would open a second sheet.
  const busy = useRef(false);

  const onPress = async () => {
    if (busy.current) return;
    busy.current = true;

    try {
      const outcome = await shareTask(task);

      if (outcome === 'copied') {
        showSnackbar({ message: 'Link copied', type: 'success' });
      }
    } catch (error) {
      console.error(error);
      showSnackbar({ message: "Couldn't share this task", type: 'error' });
    } finally {
      busy.current = false;
    }
  };

  return (
    <HeaderSlot side="right">
      <Pressable
        testID="share-task"
        accessibilityRole="button"
        accessibilityLabel="Share task"
        accessibilityHint="Opens the system share sheet"
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
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
});
