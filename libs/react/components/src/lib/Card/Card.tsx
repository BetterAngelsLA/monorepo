import clsx from 'clsx';
import { ReactNode } from 'react';

interface ICardProps {
  children: ReactNode;
  px?: 'px-0' | 'px-6';
  pb?: 'pb-0' | 'pb-6';
  title?: string;
  className?: string;
}

export function Card(props: ICardProps) {
  const { children, px = 'px-6', title, pb = 'pb-6', className } = props;

  const baseClasses = 'border-neutral-90 border pt-6 rounded-lg bg-white';

  const pxClasses = clsx(baseClasses, px, pb, className);

  return (
    <div className={pxClasses}>
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
