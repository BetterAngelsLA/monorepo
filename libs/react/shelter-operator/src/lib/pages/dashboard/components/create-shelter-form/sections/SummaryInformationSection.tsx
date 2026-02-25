import { DemographicChoices, ShelterChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import {
  DEMOGRAPHICS_OPTIONS,
  SHELTER_TYPES_OPTIONS,
  SPECIAL_SITUATION_OPTIONS,
} from '../../../formOptions';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export const SummaryInformationSection = memo(function SummaryInformationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Summary Information">
      <CheckboxGroup
        name="demographics"
        label="Demographics Served"
        options={DEMOGRAPHICS_OPTIONS}
        values={data.demographics}
        onChange={(values) => {
          onChange('demographics', values);
          if (!values.includes(DemographicChoices.Other) && data.demographicsOther) {
            onChange('demographicsOther', '');
          }
        }}
        error={errors.demographics}
        required
      />
      {data.demographics.includes(DemographicChoices.Other) ? (
        <TextField
          id="demographics-other"
          name="demographicsOther"
          label="Other Demographics"
          value={data.demographicsOther}
          onChange={(value) => onChange('demographicsOther', value)}
        />
      ) : null}
      <CheckboxGroup
        name="special-situation"
        label="Special Situation Restrictions"
        options={SPECIAL_SITUATION_OPTIONS}
        values={data.specialSituationRestrictions}
        onChange={(values) => onChange('specialSituationRestrictions', values)}
        error={errors.specialSituationRestrictions}
        required
      />
      <CheckboxGroup
        name="shelter-types"
        label="Shelter Types"
        options={SHELTER_TYPES_OPTIONS}
        values={data.shelterTypes}
        onChange={(values) => {
          onChange('shelterTypes', values);
          if (!values.includes(ShelterChoices.Other) && data.shelterTypesOther) {
            onChange('shelterTypesOther', '');
          }
        }}
      />
      {data.shelterTypes.includes(ShelterChoices.Other) ? (
        <TextField
          id="shelter-types-other"
          name="shelterTypesOther"
          label="Other Shelter Types"
          value={data.shelterTypesOther}
          onChange={(value) => onChange('shelterTypesOther', value)}
        />
      ) : null}
      <TextAreaField
        id="shelter-description"
        name="description"
        label="Description"
        value={data.description}
        onChange={(value) => onChange('description', value)}
        rows={4}
        required
        error={errors.description}
      />
    </FormSection>
  );
});
