import { mergeCss } from '@monorepo/react/shared';
import { Text } from '../text/text';

export type LabelVariant = 'default' | 'offset';

type TProps = {
  label?: string;
  inputId?: string;
  required?: boolean;
  variant?: LabelVariant;
  className?: string;
};

export function Label(props: TProps) {
  const { label, inputId, required, variant, className } = props;

  return (
    <label
      htmlFor={inputId}
      className={mergeCss([
        'text-sm text-gray-900',
        variant === 'offset' && 'pl-5',
        className,
      ])}
    >
      <Text variant="body" className="text-gray-900">
        {label}
      </Text>

      {required && (
        <Text variant="body" className="text-red-500">
          {' '}
          *
        </Text>
      )}
    </label>
  );
}
