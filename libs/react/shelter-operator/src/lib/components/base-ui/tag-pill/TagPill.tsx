import { mergeCss } from '@monorepo/react/shared';
import type { ReactNode } from 'react';

export function TagPill({
  children,
  variant = 'muted',
}: {
  children: ReactNode;
  variant?: 'muted' | 'primary';
}) {
  return (
    <span
      className={mergeCss([
        'inline-flex rounded-full px-3 py-1 text-xs font-medium leading-none',
        variant === 'primary'
          ? 'bg-[#008CEE] text-white'
          : 'bg-[#EDEFF5] text-[#747A82]',
      ])}
    >
      {children}
    </span>
  );
}
