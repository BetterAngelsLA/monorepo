import { mergeCss } from '@monorepo/react/shared';
import { Button } from '../../base-ui/buttons';

type TProps = {
  className?: string;
  onPrimaryClick: () => void;
  primaryLabel?: string;
  primaryClassName?: string;
  onSecondaryClick?: () => void;
  secondaryLabel?: string;
  secondaryClassName?: string;
  disabled?: boolean;
};

export function FormActions(props: TProps) {
  const {
    onPrimaryClick,
    primaryLabel = 'Save',
    primaryClassName,
    onSecondaryClick,
    secondaryLabel = 'Cancel',
    secondaryClassName,
    className,
    disabled,
  } = props;

  const parentCss = ['fixed bottom-6 right-6 text-sm z-20 flex gap-4 p-4'];

  return (
    <div className={mergeCss([parentCss, className])}>
      {!!onSecondaryClick && (
        <Button
          variant="floating-inverse"
          onClick={onSecondaryClick}
          className={mergeCss([secondaryClassName])}
          disabled={disabled}
        >
          {secondaryLabel}
        </Button>
      )}

      <Button
        variant="floating"
        onClick={onPrimaryClick}
        className={mergeCss([primaryClassName])}
        disabled={disabled}
      >
        {primaryLabel}
      </Button>
    </div>
  );
}
