interface IProps {
  className?: string;
  url?: string;
  children: ReactNode;
}

import { ReactNode } from 'react';

export default function HeroContainer(props: IProps) {
  const { className, url, children } = props;

  const parentCss = [
    'flex',
    'items-center',
    'justify-left',
    'bg-cover',
    'bg-no-repeat',
    'bg-center',
    'w-full',
    'h-full',
    className,
  ].join(' ');

  if (!url) {
    return null;
  }

  return (
    <div
      className={parentCss}
      style={{
        backgroundImage: `url(${url})`,
      }}
    >
      {children}
    </div>
  );
}
