import BottomActions from '../BottomActions';
import TextButton from '../TextButton';

export type TFormButtons = {
  onSubmit: () => void;
  submitTitle?: string;
  disabled?: boolean;
  onLeftBtnClick?: () => void;
  leftBtnLabel?: string;
  accessibilityHint?: string;
};

export function FormButtons(props: TFormButtons) {
  const {
    submitTitle = 'Save',
    disabled,
    leftBtnLabel = 'Cancel',
    onLeftBtnClick,
    onSubmit,
    accessibilityHint = 'cancel',
  } = props;

  if (!onSubmit) {
    return null;
  }

  return (
    <BottomActions
      disabled={disabled}
      submitTitle={submitTitle}
      onSubmit={onSubmit}
      cancel={
        <TextButton
          disabled={disabled}
          onPress={onLeftBtnClick}
          fontSize="sm"
          accessibilityHint={accessibilityHint}
          title={leftBtnLabel}
        />
      }
    />
  );
}
