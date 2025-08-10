import { Children, ReactNode } from 'react';
import { mergeCss } from '../../utils';
import { SbListItem } from './SbListItem';

type Props = {
  children: ReactNode;
  className?: string;
  itemClassname?: string;
  gap?: string | number;
};

export function SbList(props: Props) {
  const { children, className, itemClassname } = props;

  const parentCss = ['flex', 'flex-col', 'gap-4', className];
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
