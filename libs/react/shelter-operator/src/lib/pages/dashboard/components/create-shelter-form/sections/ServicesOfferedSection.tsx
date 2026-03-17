import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import type { SectionProps } from '../types';

export const ServicesOfferedSection = memo(function ServicesOfferedSection({
  data,
  onChange,
}: SectionProps) {
  return (
    <FormSection title="Services Offered">
      <TextAreaField
        id="other-services"
        name="otherServices"
        label="Other Services"
        helperText="Structured service selection has moved to the unified service catalog; use this field for any freeform notes until the operator form adds the new lookup."
        value={data.otherServices}
        onChange={(value) => onChange('otherServices', value)}
        rows={3}
      />
    </FormSection>
  );
});
