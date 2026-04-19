import clsx from 'clsx';
import type { ReactNode } from 'react';
import { SECTION_CLASS, SECTION_TITLE_CLASS } from './styles';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export function FormSection({
  title,
  children,
  className,
  titleClassName,
  contentClassName,
}: FormSectionProps) {
  return (
    <section className={clsx(SECTION_CLASS, className)}>
      <h2 className={clsx(SECTION_TITLE_CLASS, titleClassName)}>{title}</h2>
      <div className={clsx('space-y-4', contentClassName)}>{children}</div>
    </section>
  );
}
