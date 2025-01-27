interface IProps {
  className?: string;
  url?: string;
  children: ReactNode;
}

import { ReactNode } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';

export default function HeroContainer(props: IProps) {
  const { className, url, children } = props;

  const parentCss = [
    'flex',
    'items-center',
    'justify-left',
    `bg-steel-blue`,
    'bg-cover',
    'bg-no-repeat',
    'bg-center',
    'w-full',
    'h-full',
    className,
  ];

  if (!url) {
    return null;
  }

  return (
    <div
      className={mergeCss(parentCss)}
      style={{
        backgroundImage: `url(${url})`,
      }}
    >
      {children}
    </div>
  );
}
