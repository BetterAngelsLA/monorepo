import { mergeCss } from '@monorepo/react/shared';
import { useId } from 'react';
import { Text } from '../text/text';

type TProps = {
  id?: string;
  label?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  isViewMode?: boolean;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
};

export function Switch(props: TProps) {
  const {
    id,
    label,
    value,
    onChange,
    disabled = false,
    isViewMode = false,
    trueLabel = 'Yes',
    falseLabel = 'No',
    className,
  } = props;

  const generatedId = useId();
  const switchId = id ?? generatedId;
  const isViewEditMode = typeof isViewMode === 'boolean';

  const optionCss = [
    'inline-flex items-center justify-center px-4 transition-all duration-200 rounded-full',
  ];

  const selectedOptionCss = ['bg-white shadow-sm'];

  return (
    <div className={mergeCss(['flex flex-col gap-1 font-sans', className])}>
      {label && (
        <label
          htmlFor={switchId}
          className={mergeCss([isViewEditMode && 'pl-5'])}
        >
          <Text variant="body" className="text-gray-900">
            {label}
          </Text>
        </label>
      )}

      {isViewMode && (
        <Text className={mergeCss(['h-12', isViewEditMode && 'pl-5'])}>
          {value ? trueLabel : falseLabel}
        </Text>
      )}

      {!isViewMode && (
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={value}
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={mergeCss([
            'inline-flex shrink-0 items-stretch rounded-full h-12 w-fit p-1 bg-[#F3F3F9] transition-colors duration-200',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ])}
        >
          <span className={mergeCss([optionCss, value && selectedOptionCss])}>
            <Text className={mergeCss([''])}>{trueLabel}</Text>
          </span>

          <span className={mergeCss([optionCss, !value && selectedOptionCss])}>
            <Text className={mergeCss([''])}>{falseLabel}</Text>
          </span>
        </button>
      )}
    </div>
  );
}
