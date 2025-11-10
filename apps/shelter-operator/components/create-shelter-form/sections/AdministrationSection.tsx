import { STATUS_OPTIONS } from '../../../types';
import { FormSection } from '../components/FormSection';
import { SelectField } from '../components/SelectField';
import type { SectionProps } from '../types';
import { mapToCheckboxOptions } from '../utils/formUtils';

const statusOptions = mapToCheckboxOptions(STATUS_OPTIONS);

export function AdministrationSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Administration">
      <SelectField
        id="status"
        name="status"
        label="Status"
        options={statusOptions}
        value={data.status}
        onChange={value => onChange('status', value)}
        error={errors.status}
      />
    </FormSection>
  );
}
