import {
  ENTRY_REQUIREMENTS_OPTIONS,
  REFERRAL_REQUIREMENT_OPTIONS,
} from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import type { SectionProps } from '../types';
import { mapToCheckboxOptions } from '../utils/formUtils';

const entryRequirementOptions = mapToCheckboxOptions(ENTRY_REQUIREMENTS_OPTIONS);
const referralRequirementOptions = mapToCheckboxOptions(REFERRAL_REQUIREMENT_OPTIONS);

export function EntryRequirementsSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Entry Requirements">
      <CheckboxGroup
        name="entry-requirements"
        label="Entry Requirements"
        options={entryRequirementOptions}
        values={data.entry_requirements}
        onChange={values => onChange('entry_requirements', values)}
        error={errors.entry_requirements}
      />
      <CheckboxGroup
        name="referral-requirement"
        label="Referral Requirement"
        options={referralRequirementOptions}
        values={data.referral_requirement}
        onChange={values => onChange('referral_requirement', values)}
        error={errors.referral_requirement}
      />
      <TextField
        id="bed-fees"
        name="bed_fees"
        label="Bed Fees"
        value={data.bed_fees}
        onChange={value => onChange('bed_fees', value)}
      />
      <TextField
        id="program-fees"
        name="program_fees"
        label="Program Fees"
        value={data.program_fees}
        onChange={value => onChange('program_fees', value)}
      />
      <TextAreaField
        id="entry-info"
        name="entry_info"
        label="Entry Information"
        value={data.entry_info}
        onChange={value => onChange('entry_info', value)}
        rows={3}
      />
    </FormSection>
  );
}
