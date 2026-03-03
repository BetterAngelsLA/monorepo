import { memo } from 'react';
import { STATUS_OPTIONS } from '../../../formOptions';
import {
  Dropdown,
  DropdownOption,
} from '../../../../../components/base-ui/dropdown';
import { FormSection } from '../../../../../components/form/FormSection';
import type { SectionProps } from '../types';

export const AdministrationSection = memo(function AdministrationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Administration">
      <Dropdown
        label="Status"
        placeholder="Select a status"
        options={STATUS_OPTIONS}
        value={
          data.status
            ? STATUS_OPTIONS.find((o) => o.value === data.status) ?? null
            : null
        }
        onChange={(selected) => {
          const option = selected as DropdownOption | null;
          onChange('status', option ? (option.value as string) : '');
        }}
      />
      {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
    </FormSection>
  );
});
