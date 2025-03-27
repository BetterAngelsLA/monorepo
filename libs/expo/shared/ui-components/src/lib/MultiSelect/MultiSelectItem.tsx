import { StyleProp, ViewStyle } from 'react-native';
import Checkbox from '../Checkbox';
import TextRegular from '../TextRegular';

interface TMultiSelectItem {
  style?: StyleProp<ViewStyle>;
  label: string;
  testId?: string;
  isChecked?: boolean;
  accessibilityHint?: string;
  onClick: () => void;
}

export function MultiSelectItem(props: TMultiSelectItem) {
  const { style, accessibilityHint, onClick, isChecked, label, testId } = props;

  return (
    <Checkbox
      isChecked={!!isChecked}
      onCheck={onClick}
      size="sm"
      hasBorder
      label={<TextRegular>{label}</TextRegular>}
      accessibilityHint={accessibilityHint || ''}
      testId={testId}
    />
  );
}
