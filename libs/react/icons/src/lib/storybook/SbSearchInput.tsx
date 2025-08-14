import { mergeCss } from '@monorepo/react/components';
import { Input } from '../../../../components/src/lib/Input';

type TProps = {
  placeholder?: string;
  onChange?: (text: string) => void;
  className?: string;
};

export function SbSearchInput(props: TProps) {
  const { placeholder, onChange, className } = props;

  const parentCss = ['w-full', className];

  return (
    <Input
      className={mergeCss(parentCss)}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
