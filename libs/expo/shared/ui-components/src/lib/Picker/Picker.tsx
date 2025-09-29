import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import TextBold from '../TextBold';
import { PickerField } from './PickerField';
import { NONE_VALUE } from './constants';
import { IPickerProps } from './types';

const BACKDROP_MAX_OPACITY = 0.5;
const ANIM_IN_MS = 240;
const ANIM_OUT_MS = 240;

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    error,
    selectedValue,
    placeholder,
    allowSelectNone,
    selectNoneLabel,
    items,
    label,
    required,
    disabled,
  } = props;

  const [localValue, setLocalValue] = useState<string | null>(null);
  const [isPresented, setIsPresented] = useState(false); // Modal visible
  const [sheetH, setSheetH] = useState(320); // measured on first layout

  const progress = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setLocalValue(selectedValue || null);
  }, [selectedValue]);

  const open = useCallback(() => {
    if (isPresented) return;
    requestAnimationFrame(() => {
      Keyboard.dismiss();
      setIsPresented(true);
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: ANIM_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [isPresented, progress]);

  const close = useCallback(
    (commitValue?: string | null) => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 0,
        duration: ANIM_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIsPresented(false);
        if (commitValue !== undefined) {
          if (commitValue === NONE_VALUE) onChange(null);
          else onChange(commitValue ?? items[0]?.value ?? null);
        }
      });
    },
    [items, onChange, progress]
  );

  const onPressDone = useCallback(() => {
    close(localValue);
  }, [close, localValue]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BACKDROP_MAX_OPACITY],
  });

  const bottomPadding = useMemo(() => insets.bottom, [insets.bottom]);

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onPress={open} // open on press (avoid focus loops)
        items={items}
        label={label}
        error={error}
      />

      <Modal
        transparent
        visible={isPresented}
        animationType="none" // we animate manually
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle="overFullScreen"
        onRequestClose={() => close()} // Android back button
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
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height || 320)}
        >
          <SafeAreaView
            style={[
              styles.sheet,
              {
                paddingBottom: bottomPadding,
                backgroundColor: Colors.IOS_GRAY,
                borderTopLeftRadius: Radiuses.xs,
                borderTopRightRadius: Radiuses.xs,
              },
            ]}
          >
            <View style={styles.doneContainer}>
              <Pressable
                accessibilityHint={`selects ${localValue}`}
                accessibilityRole="button"
                onPress={onPressDone}
                hitSlop={8}
              >
                <TextBold color={Colors.IOS_BLUE} size="ms">
                  Done
                </TextBold>
              </Pressable>
            </View>

            <RNPicker
              style={{ backgroundColor: Colors.IOS_GRAY }}
              selectedValue={localValue}
              onValueChange={(itemValue) => setLocalValue(itemValue)}
            >
              {!!allowSelectNone && (
                <RNPicker.Item
                  label={selectNoneLabel || placeholder}
                  value={NONE_VALUE}
                  enabled
                />
              )}
              {items.map((item) => (
                <RNPicker.Item
                  key={item.value}
                  label={item.displayValue || item.value}
                  value={item.value}
                />
              ))}
            </RNPicker>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Colors.IOS_GRAY, // solid background avoids flashes
  },
  doneContainer: {
    height: 42,
    width: '100%',
    backgroundColor: '#f8f8f8ff',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacings.xs,
  },
});
