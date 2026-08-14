import { Colors } from '@monorepo/expo/shared/static';
import { CloseButton, TextBold } from '@monorepo/expo/shared/ui-components';

type TProps = {
  onClose?: () => void;
  iconColor?: Colors;
  testId?: string;
  accessibilityHint?: string;
  /** Text label for the close button (e.g. "Done"). When set, renders a text
   *  button instead of the default "×" icon. */
  label?: string;
};

export function getModalCloseBtn(props: TProps) {
  const {
    onClose,
    testId,
    iconColor = Colors.WHITE,
    accessibilityHint = 'close modal',
    label,
  } = props;

  if (!onClose) {
    return undefined;
  }

  return (
    <CloseButton
      onClose={onClose}
      testId={testId || 'modal-screen-close-btn'}
      iconColor={iconColor}
      accessibilityHint={accessibilityHint}
    >
      {label ? <TextBold color={iconColor}>{label}</TextBold> : undefined}
    </CloseButton>
  );
}
