import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Text } from '../base-ui/text/text';
import { SECTION_CLASS } from './styles';

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
      <Text variant="header-lg" className={clsx('titleClassName')}>
        {title}
      </Text>
      <div className={clsx('space-y-4', contentClassName)}>{children}</div>
    </section>
  );
}
