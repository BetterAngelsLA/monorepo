import { Picker as RNPicker } from '@react-native-picker/picker';
import { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Colors } from '@monorepo/expo/shared/static';
import { NONE_VALUE } from './constants';

type TItem = { value: string; displayValue?: string };

interface WheelPickerProps {
  initialValue: string | undefined;
  items: TItem[];
  allowSelectNone?: boolean;
  placeholder?: string;
  selectNoneLabel?: string;
  onDraftChange?: (val: string) => void;
}

export const WheelPicker = memo(function WheelPicker({
  initialValue,
  items,
  allowSelectNone,
  placeholder,
  selectNoneLabel,
  onDraftChange,
}: WheelPickerProps) {
  const [local, setLocal] = useState<string | undefined>(initialValue);

  // Reset local state if parent initialValue changes (on open)
  useEffect(() => {
    setLocal(initialValue);
  }, [initialValue]);

  const handleChange = useCallback(
    (val: string) => {
      setLocal(val);
      onDraftChange?.(val);
    },
    [onDraftChange]
  );

  return (
    <RNPicker
      style={styles.wheel}
      selectedValue={local}
      onValueChange={handleChange}
    >
      {!!allowSelectNone && (
        <RNPicker.Item
          label={selectNoneLabel || placeholder || 'None'}
          value={NONE_VALUE}
        />
      )}
      {items.map((item) => (
        <RNPicker.Item
          key={item.value}
          label={item.displayValue ?? item.value}
          value={item.value}
        />
      ))}
    </RNPicker>
  );
});

const styles = StyleSheet.create({
  wheel: {
    backgroundColor: Colors.IOS_GRAY,
  },
});
