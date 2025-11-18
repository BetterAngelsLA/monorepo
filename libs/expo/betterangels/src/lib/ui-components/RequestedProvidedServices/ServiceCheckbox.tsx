// libs/expo/ui-components/src/lib/Picker/ServiceCheckbox.tsx
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

interface IServiceCheckboxProps {
  idx: number;
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export default function ServiceCheckbox({
  idx,
  label,
  checked,
  onToggle,
}: IServiceCheckboxProps) {
  return (
    <Checkbox
      isChecked={checked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={onToggle}
      accessibilityHint={label}
      label={
        <View style={styles.labelContainer}>
          <TextRegular style={{ flex: 1 }} ml="xs">
            {label}
          </TextRegular>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
});
