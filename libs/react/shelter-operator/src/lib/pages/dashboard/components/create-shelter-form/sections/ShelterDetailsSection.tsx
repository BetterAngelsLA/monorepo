import { ACCESSIBILITY_OPTIONS, STORAGE_OPTIONS, PETS_OPTIONS, PARKING_OPTIONS } from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import type { SectionProps } from '../types';

export function ShelterDetailsSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Shelter Details">
      <CheckboxGroup
        name="accessibility"
        label="Accessibility"
        options={ACCESSIBILITY_OPTIONS}
        values={data.accessibility}
        onChange={values => onChange('accessibility', values)}
      />
      <CheckboxGroup
        name="storage"
        label="Storage"
        options={STORAGE_OPTIONS}
        values={data.storage}
        onChange={values => onChange('storage', values)}
        error={errors.storage}
        required
      />
      <CheckboxGroup
        name="pets"
        label="Pets"
        options={PETS_OPTIONS}
        values={data.pets}
        onChange={values => onChange('pets', values)}
        error={errors.pets}
        required
      />
      <CheckboxGroup
        name="parking"
        label="Parking"
        options={PARKING_OPTIONS}
        values={data.parking}
        onChange={values => onChange('parking', values)}
        error={errors.parking}
        required
      />
      <TextAreaField
        id="shelter-details-notes"
        name="add_notes_shelter_details"
        label="Additional Notes"
        value={data.add_notes_shelter_details}
        onChange={value => onChange('add_notes_shelter_details', value)}
        rows={3}
      />
    </FormSection>
  );
}
