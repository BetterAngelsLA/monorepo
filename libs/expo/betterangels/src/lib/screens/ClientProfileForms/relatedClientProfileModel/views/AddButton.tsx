import { Colors } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';

type TProps = {
  itemName: string;
  onClick: () => void;
  disabled?: boolean;
};

export function AddButton(props: TProps) {
  const { itemName, disabled, onClick } = props;

  return (
    <TextButton
      disabled={disabled}
      fontSize="md"
      color={Colors.PRIMARY}
      accessibilityHint={`add new ${itemName}`}
      title={`Add a new ${itemName}`}
      onPress={onClick}
    />
  );
}
