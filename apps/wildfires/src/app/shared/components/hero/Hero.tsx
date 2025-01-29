import { ReactNode } from 'react';

interface IHeroProps {
  className?: string;
  backgroundImage?: string;
  children: ReactNode;
}

export default function Hero(props: IHeroProps) {
  const { className = '', backgroundImage, children } = props;

  const parentCss = [
    'flex',
    'items-center',
    'justify-left',
    'bg-cover',
    'bg-no-repeat',
    'bg-center',
    'w-full',
    className,
  ].join(' ');
  return (
    <div
      className={parentCss}
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}
