import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import FormFieldLabel from '../FormFieldLabel';
import TextRegular from '../TextRegular';

const NONE_VALUE = '__none__';

export type TPickerItem = {
  displayValue?: string;
  value: string;
};

export interface IPickerProps extends TMarginProps {
  onChange: (value: string | null) => void;
  error?: string;
  selectedValue?: string | null;
  placeholder: string;
  items: TPickerItem[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
  selectNoneLabel?: string;
  allowSelectNone?: boolean;
}

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    error,
    selectedValue,
    placeholder,
    items,
    label,
    disabled,
    required,
    selectNoneLabel,
    allowSelectNone,
  } = props;

  const noneLabel = selectNoneLabel || placeholder || 'Selece one';

  function onValueChange(newValue: string) {
    onChange(newValue === NONE_VALUE ? null : newValue);
  }

  return (
    <View>
      {label && <FormFieldLabel label={label} required={required} />}

      <View
        style={[
          styles.pickerContainer,
          {
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            ...getMarginStyles(props),
          },
        ]}
      >
        <RNPicker
          style={styles.picker}
          placeholder={placeholder}
          selectedValue={selectedValue || ''}
          onValueChange={onValueChange}
          enabled={!disabled}
          itemStyle={styles.itemStyle}
        >
          <RNPicker.Item
            label={noneLabel}
            value={NONE_VALUE}
            style={styles.itemStyle}
            color={
              allowSelectNone ? styles.itemStyle.color : Colors.NEUTRAL_DARK
            }
            enabled={!!allowSelectNone || !selectedValue}
          />
          {items.map((item) => (
            <RNPicker.Item
              style={styles.itemStyle}
              color={styles.itemStyle.color}
              key={item.value}
              label={item.displayValue || item.value}
              value={item.value}
            />
          ))}
        </RNPicker>
      </View>
      {error && (
        <TextRegular mt="xxs" size="sm" color={Colors.ERROR}>
          {error}
        </TextRegular>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  picker: {
    height: 56,
    paddingHorizontal: Spacings.sm,
    color: Colors.PRIMARY_EXTRA_DARK,
  },
  itemStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
});
