import { Children, ReactNode } from 'react';
import { mergeCss } from '../../utils';
import { SbListItem } from './SbListItem';

type Props = {
  children: ReactNode;
  className?: string;
  itemClassname?: string;
  gap?: string | number;
  variant?: 'bordered';
};

export function SbList(props: Props) {
  const { children, className, itemClassname, variant } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'gap-4',
    variant === 'bordered'
      ? 'border-2 border-dotted border-gray-200 p-8'
      : undefined,
    className,
  ];
  const listItemCss = [itemClassname];

  return (
    <div className={mergeCss(parentCss)}>
      {Children.map(children, (child, i) => (
        <SbListItem key={i} className={mergeCss(listItemCss)}>
          {child}
        </SbListItem>
      ))}
    </div>
  );
}
