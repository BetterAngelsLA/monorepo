import { memo } from 'react';
import {
  ENTRY_REQUIREMENTS_OPTIONS,
  REFERRAL_REQUIREMENT_OPTIONS,
} from '../../../formOptions';
import { Dropdown } from '../../../../../components/base-ui/dropdown/Dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import type { SectionProps } from '../types';

const selectedOptions = <T extends string>(
  options: { value: T; label: string }[],
  values: T[]
) => options.filter((option) => values.includes(option.value));

const toValues = <T extends string>(
  values: Array<{ value: string; label: string }> | null
) => (values ?? []).map((option) => option.value as T);

export const EntryRequirementsSection = memo(function EntryRequirementsSection({
  data,
  onChange,
  errors,
  isTouched,
}: SectionProps) {
  return (
    <FormSection
      title="Entry Requirements"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-6 py-6"
      titleClassName=""
    >
      <Dropdown
        label="Entry Requirements"
        options={ENTRY_REQUIREMENTS_OPTIONS}
        placeholder="Please select"
        value={selectedOptions(
          ENTRY_REQUIREMENTS_OPTIONS,
          data.entryRequirements
        )}
        onChange={(values) => onChange('entryRequirements', toValues(values))}
        error={errors.entryRequirements}
        isMulti
      />

      <Dropdown
        label="Referral Requirement"
        options={REFERRAL_REQUIREMENT_OPTIONS}
        placeholder="Please select"
        value={selectedOptions(
          REFERRAL_REQUIREMENT_OPTIONS,
          data.referralRequirement
        )}
        onChange={(values) => onChange('referralRequirement', toValues(values))}
        error={errors.referralRequirement}
        isMulti
      />

      <Input
        id="bed-fees"
        label="Bed Fees"
        placeholder="Enter amount"
        value={data.bedFees}
        onChange={(event) => onChange('bedFees', event.target.value)}
      />

      <Input
        id="program-fees"
        label="Program Fees"
        placeholder="Enter amount"
        value={data.programFees}
        onChange={(event) => onChange('programFees', event.target.value)}
      />

      <Input
        id="entry-info"
        variant="paragraph"
        label="Entry Information"
        placeholder="Describe here"
        value={data.entryInfo}
        onChange={(event) => onChange('entryInfo', event.target.value)}
        isTouched={isTouched}
      />
    </FormSection>
  );
});
