import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
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
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setLocalValue(selectedValue ?? null);
  }, [selectedValue]);

  function open() {
    if (disabled) return;
    Keyboard.dismiss();
    setVisible(true);
  }

  function close(commit?: string | null) {
    setVisible(false);
    if (commit === undefined) return; // dismissed
    if (commit === NONE_VALUE) return onChange(null);
    onChange(commit ?? items[0]?.value ?? null);
  }

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onPress={open} // open on press (avoids focus loops)
        items={items}
        label={label}
        error={error}
      />

      <Modal
        visible={visible}
        transparent
        animationType="slide" // simple, flicker-free
        presentationStyle="overFullScreen"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={() => close()} // Android back
      >
        {/* Backdrop (tap to dismiss without committing) */}
        <TouchableWithoutFeedback
          accessibilityRole="button"
          onPress={() => close()}
        >
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet (no custom animation) */}
        <View style={styles.sheetContainer}>
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
              onValueChange={(val) => setLocalValue(val)}
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
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.5,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    // solid background to avoid any “peek through”
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
