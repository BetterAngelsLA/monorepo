import { mergeCss } from '@monorepo/react/components';
import { ImageIcon } from '@monorepo/react/icons';

type TProps = {
  className?: string;
};

export function ImagePlaceholder(props: TProps) {
  const { className } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'justify-center',
    'items-center',
    'bg-neutral-99',
    'py-12',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <ImageIcon className="text-primary-60 h-20" />
    </div>
  );
}
