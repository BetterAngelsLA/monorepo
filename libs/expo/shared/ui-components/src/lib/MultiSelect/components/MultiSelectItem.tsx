import Checkbox from '../../Checkbox';
import TextRegular from '../../TextRegular';

export interface TMultiSelectItem {
  isChecked?: boolean;
  label: string;
  onClick: () => void;
  accessibilityHint?: string;
  testId?: string;
}

export function MultiSelectItem(props: TMultiSelectItem) {
  const { accessibilityHint, onClick, isChecked, label, testId } = props;

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
