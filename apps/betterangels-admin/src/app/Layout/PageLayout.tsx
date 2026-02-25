import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children?: ReactNode;
};

export default function PageLayout(props: TProps) {
  const { className, children } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'h-screen',
    'bg-white',
    'pt-16',
    'pl-20',
    'pr-12',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}
