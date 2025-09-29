import { ChevronLeftIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextBold } from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SelectStatusProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  options: { value: string; displayValue?: string; bg: string; text: string }[];
  title?: string;
  selectedValue?: string | null; // kept for compatibility with your other usage
};

const DURATION = 220;

export function SelectStatus({
  value,
  onChange,
  disabled,
  options,
  title,
}: SelectStatusProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  // one driver for both backdrop and sheet to avoid flicker
  const progress = useRef(new Animated.Value(0)).current;
  const [sheetH, setSheetH] = useState(260);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  const animateTo = useCallback(
    (to: 0 | 1, after?: () => void) => {
      Animated.timing(progress, {
        toValue: to,
        duration: DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) after?.();
      });
    },
    [progress]
  );

  const openSheet = () => {
    if (disabled || open) return;
    setOpen(true);
    progress.setValue(0);
    animateTo(1);
  };

  const closeSheet = (commit?: string) => {
    animateTo(0, () => {
      setOpen(false);
      if (commit !== undefined) onChange(commit);
    });
  };

  // Re-run open animation if Modal is shown again
  useEffect(() => {
    if (open) {
      progress.setValue(0);
      animateTo(1);
    }
  }, [open, animateTo, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const Chevron = ({ up = false }: { up?: boolean }) => (
    <ChevronLeftIcon
      size="sm"
      color={current?.text || Colors.WHITE}
      rotate={up ? '90deg' : '270deg'}
    />
  );

  return (
    <>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityHint="Opens the status selection menu"
        accessibilityLabel={
          current ? `${current.value}, open menu` : 'Open menu'
        }
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: current?.bg ?? Colors.NEUTRAL_DARK },
          pressed && !disabled ? { opacity: 0.85 } : undefined,
          disabled ? { opacity: 0.6 } : undefined,
        ]}
      >
        <TextBold size="sm" color={current?.text}>
          {current?.displayValue}
        </TextBold>
        <Chevron up={open} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none" // we do a custom fade+slide
        presentationStyle="overFullScreen"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={() => closeSheet()}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback
          accessibilityRole="button"
          onPress={() => closeSheet()}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          pointerEvents="box-none"
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height || sheetH)}
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + Spacings.md },
            ]}
          >
            <IconButton
              style={{ alignSelf: 'flex-end' }}
              onPress={() => closeSheet()}
              variant="transparent"
              accessibilityLabel="close menu"
              accessibilityHint="Closes the menu"
            >
              <PlusIcon rotate="45deg" />
            </IconButton>

            {title && (
              <TextBold mb="md" size="xl">
                {title}
              </TextBold>
            )}

            <View style={styles.list}>
              {options.map((opt) => {
                const selected = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => closeSheet(opt.value)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      { backgroundColor: opt.bg },
                      pressed ? { opacity: 0.9 } : undefined,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <TextBold color={opt.text}>{opt.displayValue}</TextBold>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    height: 36,
    borderRadius: Radiuses.xs,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    gap: Spacings.xs,
  },

  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  sheet: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: Radiuses.md,
    borderTopRightRadius: Radiuses.md,
    paddingHorizontal: Spacings.md,
  },

  list: {
    gap: Spacings.xs,
  },

  optionRow: {
    borderRadius: Radiuses.xs,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
