import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  Item: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

export function SbkGalleryCard(props: TProps) {
  const { Item, title, subtitle, className } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'items-center',
    'px-8',
    'pt-8',
    'pb-2',
    'border',
    'rounded',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {Item}

      <SbkGalleryCardBody className="mt-6" title={title} subtitle={subtitle} />
    </div>
  );
}

type TCardBpdy = {
  title?: string;
  subtitle?: string;
  className?: string;
};

function SbkGalleryCardBody(props: TCardBpdy) {
  const { title, subtitle, className } = props;

  if (!title && !subtitle) {
    return null;
  }

  const parentCss = [
    'flex',
    'flex-col',
    'text-sm',
    'items-center',
    'text-center',
    'gap-2',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {title && <div className="text-xs">{title}</div>}

      {subtitle && <div className="text-[8px]">{subtitle}</div>}
    </div>
  );
}
