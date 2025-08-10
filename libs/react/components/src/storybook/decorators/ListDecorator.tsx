import { Children, ReactNode } from 'react';
import { mergeCss } from '../../utils';
import { ListItemDecorator } from './ListItemDecorator';

type Props = {
  children: ReactNode;
  classname?: string;
  itemClassname?: string;
  gap?: string | number;
};

export function ListDecorator(props: Props) {
  const { children, classname, itemClassname } = props;

  const parentCss = ['flex', 'flex-col', 'gap-4', classname];
  const listItemCss = [itemClassname];

  return (
    <div className={mergeCss(parentCss)}>
      {Children.map(children, (child, i) => (
        <ListItemDecorator key={i} classname={mergeCss(listItemCss)}>
          {child}
        </ListItemDecorator>
      ))}
    </div>
  );
}
