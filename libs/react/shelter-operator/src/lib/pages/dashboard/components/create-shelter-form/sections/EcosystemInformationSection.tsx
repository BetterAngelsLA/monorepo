import { FunderChoices, ShelterProgramChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import {
  CITY_COUNCIL_DISTRICT_OPTIONS,
  FUNDERS_OPTIONS,
  LA_CITIES_OPTIONS,
  SHELTER_PROGRAMS_OPTIONS,
  SPA_OPTIONS,
  SUPERVISORIAL_DISTRICT_OPTIONS,
} from '../../../formOptions';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { SelectField } from '../../../../../components/form/SelectField';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export const EcosystemInformationSection = memo(
  function EcosystemInformationSection({ data, onChange }: SectionProps) {
    return (
      <FormSection title="Ecosystem Information">
        <CheckboxGroup
          name="cities"
          label="Cities Served"
          options={LA_CITIES_OPTIONS}
          values={data.cities}
          onChange={(values) => onChange('cities', values)}
        />
        <CheckboxGroup
          name="spa"
          label="SPA (Service Planning Area)"
          options={SPA_OPTIONS}
          values={data.spa}
          onChange={(values) => onChange('spa', values)}
        />
        <SelectField
          id="city-council-district"
          name="cityCouncilDistrict"
          label="City Council District"
          options={CITY_COUNCIL_DISTRICT_OPTIONS}
          value={data.cityCouncilDistrict}
          onChange={(value) => onChange('cityCouncilDistrict', value)}
        />
        <SelectField
          id="supervisorial-district"
          name="supervisorialDistrict"
          label="Supervisorial District"
          options={SUPERVISORIAL_DISTRICT_OPTIONS}
          value={data.supervisorialDistrict}
          onChange={(value) => onChange('supervisorialDistrict', value)}
        />
        <CheckboxGroup
          name="shelter-programs"
          label="Shelter Programs"
          options={SHELTER_PROGRAMS_OPTIONS}
          values={data.shelterPrograms}
          onChange={(values) => {
            onChange('shelterPrograms', values);
            if (
              !values.includes(ShelterProgramChoices.Other) &&
              data.shelterProgramsOther
            ) {
              onChange('shelterProgramsOther', '');
            }
          }}
        />
        {data.shelterPrograms.includes(ShelterProgramChoices.Other) ? (
          <TextField
            id="shelter-programs-other"
            name="shelterProgramsOther"
            label="Other Shelter Programs"
            value={data.shelterProgramsOther}
            onChange={(value) => onChange('shelterProgramsOther', value)}
          />
        ) : null}
        <CheckboxGroup
          name="funders"
          label="Funders"
          options={FUNDERS_OPTIONS}
          values={data.funders}
          onChange={(values) => {
            onChange('funders', values);
            if (
              !values.includes(FunderChoices.Other) &&
              data.fundersOther
            ) {
              onChange('fundersOther', '');
            }
          }}
        />
        {data.funders.includes(FunderChoices.Other) ? (
          <TextField
            id="funders-other"
            name="fundersOther"
            label="Other Funders"
            value={data.fundersOther}
            onChange={(value) => onChange('fundersOther', value)}
          />
        ) : null}
      </FormSection>
    );
  }
);
