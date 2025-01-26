import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

export enum ResourceCalloutBlockType {
  ALERT = 'ALERT',
}

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: ResourceCalloutBlockType;
}

export function CalloutBlock(props: IProps) {
  const {
    className,
    icon,
    type = ResourceCalloutBlockType.ALERT,
    children,
  } = props;

  const parentCss = [
    'flex',
    'items-start',
    'border',
    'p-4',
    'rounded-[10px]',
    type === ResourceCalloutBlockType.ALERT ? 'bg-neutral-99' : '',
    className,
  ];

  const iconCss = ['mr-6'];

  const contentCss = ['border'];

  return (
    <div className={mergeCss(parentCss)}>
      {!!icon && <div className={mergeCss(iconCss)}>{icon}</div>}

      <div className={mergeCss(contentCss)}>{children}</div>
    </div>
  );
}
