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
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setLocalValue(selectedValue || null);
  }, [selectedValue, setLocalValue]);

  function onPressDone() {
    Keyboard.dismiss();
    setIsModalVisible(false);

    if (localValue === NONE_VALUE) {
      onChange(null);

      return;
    }

    onChange(localValue || items[0].value);
  }

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  return (
    <>
      <PickerField
        style={getMarginStyles(props)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        selectedValue={selectedValue}
        onFocus={() => {
          Keyboard.dismiss();
          setIsModalVisible(true);
        }}
        items={items}
        label={label}
        error={error}
      />
      <Modal
        style={styles.modal}
        backdropOpacity={0.5}
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        useNativeDriverForBackdrop={true}
      >
        <SafeAreaView
          style={{
            borderTopLeftRadius: Radiuses.xs,
            borderTopRightRadius: Radiuses.xs,
            paddingBottom: bottomOffset,
            backgroundColor: Colors.IOS_GRAY,
          }}
        >
          <View style={styles.doneContainer}>
            <Pressable
              accessibilityHint={`selects ${localValue}`}
              accessibilityRole="button"
              onPress={onPressDone}
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
                // using null value will return a string with value of `null`,
                // so using NONE_VALUE to be consistent with Android
                value={NONE_VALUE}
                enabled={true}
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
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
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
