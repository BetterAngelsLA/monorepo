import type { ReactNode } from 'react';
import { SECTION_CLASS, SECTION_TITLE_CLASS } from '../constants/styles';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className={SECTION_CLASS}>
      <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
