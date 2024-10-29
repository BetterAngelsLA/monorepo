import { Picker as RNPicker } from '@react-native-picker/picker';
import { useState } from 'react';

interface IPickerProps {
  setSelectedValueValue: (value: string | null) => void;
  error?: boolean;
  value?: string | null;
  placeholder: string;
  items: { label: string; value: string }[];
}

export default function Picker(props: IPickerProps) {
  const { setSelectedValueValue, error, value, placeholder, items } = props;
  const [localValue, setLocalValue] = useState<string | null>(value || null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  return (
    <RNPicker
      style={{ backgroundColor: '#d1d3da' }}
      selectedValue={localValue}
      onValueChange={(itemValue) => setLocalValue(itemValue)}
    >
      {items.map((item) => (
        <RNPicker.Item key={item.value} label={item.label} value={item.value} />
      ))}
    </RNPicker>
  );
}
