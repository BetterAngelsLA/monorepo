import { ACCESSIBILITY_OPTIONS, STORAGE_OPTIONS, PETS_OPTIONS, PARKING_OPTIONS } from '../../../types';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import type { SectionProps } from '../types';
import { mapToCheckboxOptions } from '../utils/formUtils';

const accessibilityOptions = mapToCheckboxOptions(ACCESSIBILITY_OPTIONS);
const storageOptions = mapToCheckboxOptions(STORAGE_OPTIONS);
const petsOptions = mapToCheckboxOptions(PETS_OPTIONS);
const parkingOptions = mapToCheckboxOptions(PARKING_OPTIONS);

export function ShelterDetailsSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Shelter Details">
      <CheckboxGroup
        name="accessibility"
        label="Accessibility"
        options={accessibilityOptions}
        values={data.accessibility}
        onChange={values => onChange('accessibility', values)}
      />
      <CheckboxGroup
        name="storage"
        label="Storage"
        options={storageOptions}
        values={data.storage}
        onChange={values => onChange('storage', values)}
      />
      <CheckboxGroup
        name="pets"
        label="Pets"
        options={petsOptions}
        values={data.pets}
        onChange={values => onChange('pets', values)}
      />
      <CheckboxGroup
        name="parking"
        label="Parking"
        options={parkingOptions}
        values={data.parking}
        onChange={values => onChange('parking', values)}
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
