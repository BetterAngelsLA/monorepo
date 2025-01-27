import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: 'alert';
}

export function ResourceCallout(props: IProps) {
  const { icon, type = 'alert', className, children } = props;

  const parentCss = [
    'flex',
    'p-4',
    'md:px-6',
    type === 'alert' ? 'bg-neutral-99' : 'white',
    className,
  ];

  const iconCss = ['mr-6'];

  return (
    <div className={mergeCss(parentCss)}>
      {!!icon && <div className={mergeCss(iconCss)}>{icon}</div>}
      {children}
    </div>
  );
}
