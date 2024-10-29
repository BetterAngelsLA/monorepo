import { Picker as RNPicker } from '@react-native-picker/picker';

interface IPickerProps {
  setSelectedValueValue: (value: string | null) => void;
  error?: boolean;
  value?: string | null;
  placeholder: string;
  items: { label: string; value: string }[];
}

export default function Picker(props: IPickerProps) {
  const { setSelectedValueValue, error, value, placeholder, items } = props;
  console.log(error);

  return (
    <RNPicker
      placeholder={placeholder}
      style={{ backgroundColor: '#d1d3da' }}
      selectedValue={value}
      onValueChange={(itemValue) => setSelectedValueValue(itemValue)}
    >
      {items.map((item) => (
        <RNPicker.Item key={item.value} label={item.label} value={item.value} />
      ))}
    </RNPicker>
  );
}
