import { Children, ReactNode } from 'react';
import { mergeCss } from '../../utils';
import { SbListItem } from './SbListItem';

type Props = {
  children: ReactNode;
  classname?: string;
  itemClassname?: string;
  gap?: string | number;
};

export function SbList(props: Props) {
  const { children, classname, itemClassname } = props;

  const parentCss = ['flex', 'flex-col', 'gap-4', classname];
  const listItemCss = [itemClassname];

  return (
    <div className={mergeCss(parentCss)}>
      {Children.map(children, (child, i) => (
        <SbListItem key={i} classname={mergeCss(listItemCss)}>
          {child}
        </SbListItem>
      ))}
    </div>
  );
}
