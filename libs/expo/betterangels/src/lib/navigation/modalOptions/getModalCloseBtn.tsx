import { Colors } from '@monorepo/expo/shared/static';
import { CloseButton } from '@monorepo/expo/shared/ui-components';

type TProps = {
  onClose?: () => void;
  iconColor?: Colors;
  accessibilityHint?: string;
};

export function getModalCloseBtn(props: TProps) {
  const {
    onClose,
    iconColor = Colors.WHITE,
    accessibilityHint = 'close modal',
  } = props;

  if (!onClose) {
    return undefined;
  }

  return (
    <CloseButton
      onClose={onClose}
      iconColor={iconColor}
      accessibilityHint={accessibilityHint}
    />
  );
}
