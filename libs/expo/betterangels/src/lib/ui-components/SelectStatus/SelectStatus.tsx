import { ChevronLeftIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextBold } from '@monorepo/expo/shared/ui-components';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Option<T extends string> = {
  value: T;
  displayValue?: string;
  bg: string;
  text: string;
};

export type SelectStatusProps<T extends string> = {
  value: T;
  onChange: (next: T) => void | Promise<void>;
  disabled?: boolean;
  options: Option<T>[];
  title?: string;
};

const BACKDROP_MAX_OPACITY = 0.5;
const ANIM_IN_MS = 220;
const ANIM_OUT_MS = 220;

export function SelectStatus<T extends string>({
  value,
  onChange,
  disabled,
  options,
  title,
}: SelectStatusProps<T>) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  // one progress drives both backdrop & sheet (prevents flicker)
  const progress = useRef(new Animated.Value(0)).current;
  const [sheetH, setSheetH] = useState(280);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );

  const open = useCallback(() => {
    if (disabled || visible) return;
    setVisible(true);
    progress.stopAnimation();
    progress.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: ANIM_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [disabled, visible, progress]);

  const close = useCallback(
    (commit?: T) => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 0,
        duration: ANIM_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setVisible(false);
        if (commit !== undefined) void onChange(commit);
      });
    },
    [progress, onChange]
  );

  const onSelect = (next: T) => close(next);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BACKDROP_MAX_OPACITY],
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
      {/* Trigger */}
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityHint="Opens the status selection menu"
        accessibilityLabel={
          current ? `${current.value}, open menu` : 'Open menu'
        }
        onPress={open}
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
        <Chevron up={visible} />
      </Pressable>

      {/* Sheet Modal */}
      <Modal
        transparent
        visible={visible}
        animationType="none" // custom animated backdrop/sheet
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle="overFullScreen"
        onRequestClose={() => close()}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback
          accessibilityRole="button"
          onPress={() => close()}
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
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height || 280)}
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + Spacings.md },
            ]}
          >
            <IconButton
              style={{ alignSelf: 'flex-end' }}
              onPress={() => close()}
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
                    onPress={() => onSelect(opt.value)}
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
    backgroundColor: Colors.WHITE, // solid sheet avoids underlying flashes
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
