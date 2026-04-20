import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import type { SectionProps } from '../types';

export const AdditionalInformationSection = memo(
  function AdditionalInformationSection({
    data,
    onChange,
    errors,
    isTouched,
  }: SectionProps) {
    return (
      <FormSection
        title="Additional Information"
        className="rounded-none border-0 bg-transparent p-0"
        contentClassName="space-y-6 py-6"
        titleClassName=""
      ></FormSection>
    );
  }
);
