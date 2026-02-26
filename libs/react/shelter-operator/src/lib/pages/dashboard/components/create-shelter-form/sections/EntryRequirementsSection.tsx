import { memo } from 'react';
import {
  ENTRY_REQUIREMENTS_OPTIONS,
  REFERRAL_REQUIREMENT_OPTIONS,
} from '../../../formOptions';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export const EntryRequirementsSection = memo(function EntryRequirementsSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Entry Requirements">
      <CheckboxGroup
        name="entry-requirements"
        label="Entry Requirements"
        options={ENTRY_REQUIREMENTS_OPTIONS}
        values={data.entryRequirements}
        onChange={(values) => onChange('entryRequirements', values)}
        error={errors.entryRequirements}
      />
      <CheckboxGroup
        name="referral-requirement"
        label="Referral Requirement"
        options={REFERRAL_REQUIREMENT_OPTIONS}
        values={data.referralRequirement}
        onChange={(values) => onChange('referralRequirement', values)}
        error={errors.referralRequirement}
      />
      <TextField
        id="bed-fees"
        name="bedFees"
        label="Bed Fees"
        value={data.bedFees}
        onChange={(value) => onChange('bedFees', value)}
      />
      <TextField
        id="program-fees"
        name="programFees"
        label="Program Fees"
        value={data.programFees}
        onChange={(value) => onChange('programFees', value)}
      />
      <TextAreaField
        id="entry-info"
        name="entryInfo"
        label="Entry Information"
        value={data.entryInfo}
        onChange={(value) => onChange('entryInfo', value)}
        rows={3}
      />
    </FormSection>
  );
});
