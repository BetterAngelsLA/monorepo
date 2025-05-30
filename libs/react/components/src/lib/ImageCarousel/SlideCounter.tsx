import { mergeCss } from '../../utils';

type TProps = {
  total: number;
  current: number;
  className?: string;
};

export function SlideCounter(props: TProps) {
  const { current, total, className } = props;

  const parentCss = [
    'absolute',
    'z-99',
    'right-4',
    'bottom-4',
    'px-2',
    'py-1',
    'text-xs',
    'leading-[1.75]',
    'text-white',
    'bg-black/55',
    'rounded-lg',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {current}/{total}
    </div>
  );
}
