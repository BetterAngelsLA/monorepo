import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown/Dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import {
  ACCESSIBILITY_OPTIONS,
  PARKING_OPTIONS,
  PETS_OPTIONS,
  STORAGE_OPTIONS,
} from '../../../formOptions';
import type { SectionProps } from '../types';

const selectedOptions = <T extends string>(
  options: { value: T; label: string }[],
  values: T[]
) => options.filter((option) => values.includes(option.value));

const toValues = <T extends string>(
  values: Array<{ value: string; label: string }> | null
) => (values ?? []).map((option) => option.value as T);

export const ShelterDetailsSection = memo(function ShelterDetailsSection({
  data,
  onChange,
  errors,
  isTouched,
}: SectionProps) {
  return (
    <FormSection
      title="Shelter Details"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-6 py-6"
      titleClassName=""
    >
      <Dropdown
        label="Accessibility"
        placeholder="Please select"
        options={ACCESSIBILITY_OPTIONS}
        value={selectedOptions(ACCESSIBILITY_OPTIONS, data.accessibility)}
        onChange={(values) => onChange('accessibility', toValues(values))}
        isMulti
      />

      <Dropdown
        label="Storage"
        placeholder="Please select"
        options={STORAGE_OPTIONS}
        value={selectedOptions(STORAGE_OPTIONS, data.storage)}
        onChange={(values) => onChange('storage', toValues(values))}
        isMulti
        error={errors.storage}
      />

      <Dropdown
        label="Pets"
        placeholder="Please select"
        options={PETS_OPTIONS}
        value={selectedOptions(PETS_OPTIONS, data.pets)}
        onChange={(values) => onChange('pets', toValues(values))}
        isMulti
        error={errors.pets}
      />

      <Dropdown
        label="Parking"
        placeholder="Please select"
        options={PARKING_OPTIONS}
        value={selectedOptions(PARKING_OPTIONS, data.parking)}
        onChange={(values) => onChange('parking', toValues(values))}
        isMulti
        error={errors.parking}
      />

      <Input
        id="shelter-details-notes"
        variant="paragraph"
        label="Other Shelter Details"
        value={data.addNotesShelterDetails}
        placeholder="Describe here"
        onChange={(event) =>
          onChange('addNotesShelterDetails', event.target.value)
        }
        rows={3}
        isTouched={isTouched}
      />
    </FormSection>
  );
});
