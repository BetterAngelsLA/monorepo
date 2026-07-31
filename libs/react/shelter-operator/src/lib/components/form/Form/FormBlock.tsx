import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
};

const columnsCss = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function FormBlock(props: TProps) {
  const { className, columns = 3, children } = props;

  return (
    <div
      className={mergeCss([
        'grid gap-x-2 xl:gap-x-8 2xl:gap-x-16 gap-y-8',
        columnsCss[columns],
        className,
      ])}
    >
      {children}
    </div>
  );
}
