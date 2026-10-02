import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { Text } from '../text/text';

export type LabelVariant = 'default' | 'offset';

type TProps = {
  label?: string;
  inputId?: string;
  required?: boolean;
  variant?: LabelVariant;
  /** Rendered inline after the label text — e.g. a validity icon. */
  adornment?: ReactNode;
  className?: string;
};

export function Label(props: TProps) {
  const { label, inputId, required, variant, adornment, className } = props;

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
