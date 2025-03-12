import {
  Colors,
  Radiuses,
  Spacings,
  TSpacing,
} from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

export interface IPickerProps {
  onChange: (value: string) => void;
  error?: string;
  selectedValue?: string | null;
  selectedDisplayValue?: string | null;
  value?: string | null;
  placeholder: string;
  items: { displayValue?: string; value: string }[];
  label?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

export default function Picker(props: IPickerProps) {
  const {
    onChange,
    error,
    selectedValue,
    placeholder,
    items,
    label,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
  } = props;

  return (
    <View
      style={[
        styles.pickerContainer,

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
    >
      {label && <TextRegular ml="xs">{label}</TextRegular>}
      <RNPicker
        style={styles.picker}
        placeholder={placeholder}
        selectedValue={selectedValue || ''}
        onValueChange={onChange}
      >
        {items.map((item) => (
          <RNPicker.Item
            style={styles.itemStyle}
            key={item.value}
            label={item.displayValue || item.value}
            value={item.value}
          />
        ))}
      </RNPicker>
      {error && (
        <TextRegular size="sm" color={Colors.ERROR}>
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
  },
});
