import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Spacings,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../Input_V2';
import TextBold from '../TextBold';
import { IPickerProps } from './Picker';

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

    if (localValue) {
      onChange(localValue);

      return;
    }

    if (allowSelectNone) {
      onChange(null);

      return;
    }

    onChange(items[0].value);
  }

  const getDisplayValue = useCallback(
    (value?: string | null) => {
      const item = items.find((item) => item.value === value);

      return item?.displayValue ?? item?.value;
    },
    [items]
  );

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  return (
    <>
      <View
        style={[
          {
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            ...getMarginStyles(props),
          },
        ]}
      >
        <Input
          asSelect
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={getDisplayValue(localValue)}
          label={label}
          error={!!error}
          errorMessage={error}
          onFocus={() => {
            Keyboard.dismiss();
            setIsModalVisible(true);
          }}
          slotRight={{
            focusableInput: true,
            component: <ChevronLeftIcon size="sm" rotate={'-90deg'} />,
            accessibilityLabel: `selector for ${label || 'field'}`,
            accessibilityHint: `opens selector for ${label || 'field'}`,
          }}
        />
      </View>
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
            backgroundColor: '#d1d3da',
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
                value={null}
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
