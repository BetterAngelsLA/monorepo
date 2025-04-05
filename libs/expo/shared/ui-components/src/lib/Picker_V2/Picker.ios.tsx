import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormFieldLabel from '../FormFieldLabel';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';
import { IPickerProps } from './Picker';

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    error,
    selectedDisplayValue,
    selectedValue,
    placeholder,
    allowSelectNone,
    selectNoneLabel,
    items,
    label,
    required,
    disabled,
    mb,
    mt,
    my,
    mx,
    mr,
    ml,
  } = props;

  const [localValue, setLocalValue] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setLocalValue(selectedValue || null);
  }, [selectedValue, setLocalValue]);

  function onPressDone() {
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

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  return (
    <>
      <View>
        {label && <FormFieldLabel label={label} required={required} />}

        <Pressable
          disabled={disabled}
          onPress={() => setIsModalVisible(true)}
          style={[
            styles.selectButton,
            {
              borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
              marginBottom: mb && Spacings[mb],
              marginTop: mt && Spacings[mt],
              marginLeft: ml && Spacings[ml],
              marginRight: mr && Spacings[mr],
              marginHorizontal: mx && Spacings[mx],
              marginVertical: my && Spacings[my],
            },
          ]}
          accessibilityRole="button"
        >
          <TextRegular
            color={
              disabled
                ? Colors.NEUTRAL_LIGHT
                : selectedDisplayValue || selectedValue
                ? Colors.PRIMARY_EXTRA_DARK
                : Colors.NEUTRAL
            }
          >
            {selectedDisplayValue || selectedValue || placeholder}
          </TextRegular>
          <ChevronLeftIcon
            size="sm"
            rotate={'-90deg'}
            color={disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK}
          />
        </Pressable>
        {error && (
          <TextRegular size="sm" mt="xxs" color={Colors.ERROR}>
            {error}
          </TextRegular>
        )}
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
  selectButton: {
    backgroundColor: Colors.WHITE,
    height: 56,
    paddingHorizontal: Spacings.sm,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
