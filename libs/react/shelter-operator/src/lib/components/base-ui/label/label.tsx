import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { Text } from '../text/text';

export type LabelVariant = 'default' | 'offset';

export type TLabelProps = {
  label?: string;
  labelSuffix?: string;
  inputId?: string;
  required?: boolean;
  variant?: LabelVariant;
  /** Rendered inline after the label text — e.g. a validity icon. */
  adornment?: ReactNode;
  className?: string;
  suffixClassName?: string;
};

export function Label(props: TLabelProps) {
  const {
    label,
    labelSuffix,
    inputId,
    required,
    variant,
    adornment,
    className,
    suffixClassName,
  } = props;

  const suffixText = labelSuffix && labelSuffix.trim();

  const suffixCss = ['ml-1', 'italic', 'text-xs', suffixClassName];

  return (
    <label
      htmlFor={inputId}
      className={mergeCss([
        'text-sm text-gray-900',
        variant === 'offset' && 'pl-5',
        adornment && 'inline-flex items-center gap-1',
        className,
      ])}
    >
      <Text variant="body" className="text-gray-900">
        {label}

        {!!suffixText && (
          <Text className={mergeCss(suffixCss)}>{suffixText}</Text>
        )}
      </Text>

      {adornment}

      {required && (
        <Text variant="body" className="text-red-500">
          {' '}
          *
        </Text>
      )}
    </label>
  );
}
