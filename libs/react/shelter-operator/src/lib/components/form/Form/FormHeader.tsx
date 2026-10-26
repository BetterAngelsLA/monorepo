import { mergeCss } from '@monorepo/react/shared';
import { Pencil } from 'lucide-react';
import { Text, type TextVariant } from '../../base-ui/text/text';

type HeaderSize = 'sm' | 'md' | 'lg';

const HEADER_SIZE_VARIANTS: Record<HeaderSize, TextVariant> = {
  sm: 'subheading',
  md: 'header-md',
  lg: 'header-lg',
};

type TProps = {
  className?: string;
  title?: string;
  titleClassName?: string;
  size?: HeaderSize;
  onEditClick?: () => void;
};

export function FormHeader(props: TProps) {
  const { title, onEditClick, size = 'lg', className, titleClassName } = props;

  const parentCss = ['flex flex-row justify-between'];
  const titleCss = [''];

  const iconCss = ['w-6'];

  return (
    <div className={mergeCss([parentCss, className])}>
      {title && (
        <Text
          variant={HEADER_SIZE_VARIANTS[size]}
          className={mergeCss([titleCss, titleClassName])}
        >
          {title}
        </Text>
      )}

      {onEditClick && (
        <button onClick={onEditClick} className={mergeCss([iconCss])}>
          <Pencil />
        </button>
      )}
    </div>
  );
}
