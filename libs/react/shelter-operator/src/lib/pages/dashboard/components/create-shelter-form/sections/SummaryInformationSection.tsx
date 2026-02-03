import {
  DEMOGRAPHICS_OPTIONS,
  SPECIAL_SITUATION_OPTIONS,
  SHELTER_TYPES_OPTIONS,
} from '../../../types';
import { DemographicChoices, ShelterChoices } from '@monorepo/react/shelter';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import type { SectionProps } from '../types';

export function SummaryInformationSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Summary Information">
      <CheckboxGroup
        name="demographics"
        label="Demographics Served"
        options={DEMOGRAPHICS_OPTIONS}
        values={data.demographics}
        onChange={values => {
          onChange('demographics', values);
          if (!values.includes(DemographicChoices.Other) && data.demographics_other) {
            onChange('demographics_other', '');
          }
        }}
        error={errors.demographics}
        required
      />
      {data.demographics.includes(DemographicChoices.Other) ? (
        <TextField
          id="demographics-other"
          name="demographics_other"
          label="Other Demographics"
          value={data.demographics_other}
          onChange={value => onChange('demographics_other', value)}
        />
      ) : null}
      <CheckboxGroup
        name="special-situation"
        label="Special Situation Restrictions"
        options={SPECIAL_SITUATION_OPTIONS}
        values={data.special_situation_restrictions}
        onChange={values => onChange('special_situation_restrictions', values)}
        error={errors.special_situation_restrictions}
        required
      />
      <CheckboxGroup
        name="shelter-types"
        label="Shelter Types"
        options={SHELTER_TYPES_OPTIONS}
        values={data.shelter_types}
        onChange={values => {
          onChange('shelter_types', values);
          if (!values.includes(ShelterChoices.Other) && data.shelter_types_other) {
            onChange('shelter_types_other', '');
          }
        }}
      />
      {data.shelter_types.includes(ShelterChoices.Other) ? (
        <TextField
          id="shelter-types-other"
          name="shelter_types_other"
          label="Other Shelter Types"
          value={data.shelter_types_other}
          onChange={value => onChange('shelter_types_other', value)}
        />
      ) : null}
      <TextAreaField
        id="shelter-description"
        name="description"
        label="Description"
        value={data.description}
        onChange={value => onChange('description', value)}
        rows={4}
        required
        error={errors.description}
      />
    </FormSection>
  );
}
