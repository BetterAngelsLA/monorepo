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

  const iconWrapperCss = ['bg-white', 'p-6', 'rounded-full'];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(iconWrapperCss)}>
        <ImageIcon className="text-steel-blue h-11" />
      </div>

      <div className="text-sm mt-2">No Image Available</div>
    </div>
  );
}
