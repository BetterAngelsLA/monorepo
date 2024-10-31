import { Picker as RNPicker } from '@react-native-picker/picker';

interface IPickerProps {
  setSelectedValue: (value: string | null) => void;
  error?: boolean;
  value?: string | null;
  placeholder: string;
  items: { label: string; value: string }[];
}

export default function Picker(props: IPickerProps) {
  const { setSelectedValue, error, value, placeholder, items } = props;

  return (
    <RNPicker
      style={{ color: error ? 'red' : 'black' }}
      placeholder={placeholder}
      selectedValue={value}
      onValueChange={(itemValue) => setSelectedValue(itemValue)}
    >
      {items.map((item) => (
        <RNPicker.Item key={item.value} label={item.label} value={item.value} />
      ))}
    </RNPicker>
  );
}
