import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';
import { IPickerProps } from './Picker';

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    error,
    displayValue,
    value,
    placeholder,
    items,
    label,
    mb,
    mt,
    my,
    mx,
    mr,
    ml,
  } = props;
  const [localValue, setLocalValue] = useState<string | null>(value || null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  return (
    <>
      {label && <TextRegular ml="xs">{label}</TextRegular>}
      <Pressable
        onPress={() => {
          setIsModalVisible(true);
          if (!localValue && items[0].value) {
            setLocalValue(items[0].value);
          }
        }}
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
          color={displayValue ? Colors.PRIMARY_EXTRA_DARK : Colors.NEUTRAL}
        >
          {displayValue || placeholder}
        </TextRegular>
        <ChevronLeftIcon size="sm" rotate={'-90deg'} />
      </Pressable>
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
              onPress={() => {
                if (localValue) {
                  onChange(localValue);
                }
                setIsModalVisible(false);
              }}
            >
              <TextBold color="#007aff" size="ms">
                Done
              </TextBold>
            </Pressable>
          </View>
          <RNPicker
            style={{ backgroundColor: '#d1d3da' }}
            selectedValue={localValue}
            onValueChange={(itemValue) => setLocalValue(itemValue)}
          >
            {items.map((item) => (
              <RNPicker.Item
                key={item.value}
                label={item.displayValue}
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
