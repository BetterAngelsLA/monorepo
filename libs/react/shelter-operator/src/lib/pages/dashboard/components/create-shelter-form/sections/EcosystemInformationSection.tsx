import {
  CITY_COUNCIL_DISTRICT_OPTIONS,
  FUNDERS_OPTIONS,
  LA_CITIES_OPTIONS,
  SHELTER_PROGRAMS_OPTIONS,
  SPA_OPTIONS,
  SUPERVISORIAL_DISTRICT_OPTIONS,
} from '../../../types';
import { FunderChoices, ShelterProgramChoices } from '@monorepo/react/shelter';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { SelectField } from '../../../../../components/form/SelectField';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export function EcosystemInformationSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Ecosystem Information">
      <CheckboxGroup
        name="cities"
        label="Cities Served"
        options={LA_CITIES_OPTIONS}
        values={data.cities}
        onChange={values => onChange('cities', values)}
      />
      <CheckboxGroup
        name="spa"
        label="SPA (Service Planning Area)"
        options={SPA_OPTIONS}
        values={data.spa}
        onChange={values => onChange('spa', values)}
      />
      <SelectField
        id="city-council-district"
        name="city_council_district"
        label="City Council District"
        options={CITY_COUNCIL_DISTRICT_OPTIONS}
        value={data.city_council_district}
        onChange={value => onChange('city_council_district', value)}
      />
      <SelectField
        id="supervisorial-district"
        name="supervisorial_district"
        label="Supervisorial District"
        options={SUPERVISORIAL_DISTRICT_OPTIONS}
        value={data.supervisorial_district}
        onChange={value => onChange('supervisorial_district', value)}
      />
      <CheckboxGroup
        name="shelter-programs"
        label="Shelter Programs"
        options={SHELTER_PROGRAMS_OPTIONS}
        values={data.shelter_programs}
        onChange={values => {
          onChange('shelter_programs', values);
          if (!values.includes(ShelterProgramChoices.Other) && data.shelter_programs_other) {
            onChange('shelter_programs_other', '');
          }
        }}
      />
      {data.shelter_programs.includes(ShelterProgramChoices.Other) ? (
        <TextField
          id="shelter-programs-other"
          name="shelter_programs_other"
          label="Other Shelter Programs"
          value={data.shelter_programs_other}
          onChange={value => onChange('shelter_programs_other', value)}
        />
      ) : null}
      <CheckboxGroup
        name="funders"
        label="Funders"
        options={FUNDERS_OPTIONS}
        values={data.funders}
        onChange={values => {
          onChange('funders', values);
          if (!values.includes(FunderChoices.Other) && data.funders_other) {
            onChange('funders_other', '');
          }
        }}
      />
      {data.funders.includes(FunderChoices.Other) ? (
        <TextField
          id="funders-other"
          name="funders_other"
          label="Other Funders"
          value={data.funders_other}
          onChange={value => onChange('funders_other', value)}
        />
      ) : null}
    </FormSection>
  );
}
