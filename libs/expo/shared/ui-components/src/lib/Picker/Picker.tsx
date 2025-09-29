import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
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

const DURATION = 240;

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

  const insets = useSafeAreaInsets();

  const [localValue, setLocalValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [sheetH, setSheetH] = useState(320);

  // One driver for both backdrop fade and sheet slide
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalValue(selectedValue ?? null);
  }, [selectedValue]);

  const timing = (to: 0 | 1, after?: () => void) =>
    Animated.timing(progress, {
      toValue: to,
      duration: DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => finished && after?.());

  function open() {
    if (disabled || visible) return;
    Keyboard.dismiss();
    setVisible(true);
    progress.setValue(0);
    timing(1);
  }

  function close(commit?: string | null) {
    timing(0, () => {
      setVisible(false);
      if (commit === undefined) return; // dismissed/cancel
      if (commit === NONE_VALUE) return onChange(null);
      onChange(commit ?? items[0]?.value ?? null);
    });
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onPress={open} // open on press; avoids iOS focus loops
        items={items}
        label={label}
        error={error}
      />

      <Modal
        visible={visible}
        transparent
        animationType="none" // we animate the sheet/backdrop ourselves
        presentationStyle="overFullScreen"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={() => close()} // Android back
      >
        {/* Backdrop (container is transparent; black is inside the Animated view) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => close()}
          style={StyleSheet.absoluteFill} // no background here (prevents full-black flash)
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        {/* Sliding sheet */}
        <Animated.View
          pointerEvents="box-none"
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height || 320;
            if (h !== sheetH) setSheetH(h);
          }}
        >
          <SafeAreaView
            style={[
              styles.sheet,
              {
                paddingBottom: insets.bottom,
                backgroundColor: Colors.IOS_GRAY,
                borderTopLeftRadius: Radiuses.xs,
                borderTopRightRadius: Radiuses.xs,
              },
            ]}
          >
            <View style={styles.doneContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint={`selects ${localValue}`}
                onPress={() => close(localValue)}
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
              onValueChange={setLocalValue}
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
    // solid background avoids any "peek through"
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
