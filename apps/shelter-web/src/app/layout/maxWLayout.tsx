import { PropsWithChildren, ReactElement } from 'react';
import { twCss } from '../shared/utils/styles/twCss';

interface IParams extends PropsWithChildren {
  className?: string;
  negativeMx?: 1 | 2;
}

export function MaxWLayout(props: IParams): ReactElement {
  const { className = '', negativeMx, children } = props;

  // let negativeMarginStyles;

  // if (negativeMx) {
  //   const negativeMargin = `-mx-[${negativeMx}px]`;
  //   // const negativeMargin = `-mx-[16px]`;

  //   negativeMarginStyles = [negativeMargin, 'lg:mx-0'];
  // }

  const parentCss = [
    'max-w-7xl',
    'min-w-full',
    'flex',
    'flex-col',
    negativeMx === 1 ? '-mx-4' : '',
    negativeMx === 2 ? '-mx-8' : '',
    'lg:mx-0',

    className,
  ];

  return <div className={twCss(parentCss)}>{children}</div>;
}
