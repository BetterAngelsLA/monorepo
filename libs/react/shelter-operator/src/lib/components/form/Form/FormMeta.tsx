import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children: ReactNode;
};

/** Read-only meta/admin info block (e.g. updated at/by) rendered at the
 * bottom of a form. */
export function FormMeta(props: TProps) {
  const { className, children } = props;

  return (
    <div
      className={mergeCss([
        'flex flex-col gap-1 rounded-xl bg-gray-50 px-4 py-4',
        className,
      ])}
    >
      {children}
    </div>
  );
}
