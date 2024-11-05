import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';

export interface IPickerProps {
  setSelectedValue: (value: string | null) => void;
  error?: boolean;
  value?: string | null;
  placeholder: string;
  items: { label: string; value: string }[];
}

export default function Picker(props: IPickerProps) {
  const { setSelectedValue, error, value, placeholder, items } = props;

  return (
    <View
      style={[
        styles.pickerContainer,
        {
          borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
      ]}
    >
      <RNPicker
        style={styles.picker}
        placeholder={placeholder}
        selectedValue={value}
        onValueChange={(itemValue) => setSelectedValue(itemValue)}
      >
        {items.map((item) => (
          <RNPicker.Item
            style={styles.itemStyle}
            key={item.value}
            label={item.label}
            value={item.value}
          />
        ))}
      </RNPicker>
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
