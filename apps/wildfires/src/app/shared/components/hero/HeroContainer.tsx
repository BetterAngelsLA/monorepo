import { PropsWithChildren } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  url?: string;
}

export function HeroContainer(props: IProps) {
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
