import { STATUS_OPTIONS } from '../../../types';
import { FormSection } from '../components/FormSection';
import { SelectField } from '../components/SelectField';
import type { SectionProps } from '../types';

export function AdministrationSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Administration">
      <SelectField
        id="status"
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        value={data.status}
        onChange={value => onChange('status', value)}
        error={errors.status}
        required
      />
    </FormSection>
  );
}
