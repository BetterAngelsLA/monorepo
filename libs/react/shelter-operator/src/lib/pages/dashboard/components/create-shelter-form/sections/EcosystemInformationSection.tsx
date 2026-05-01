import { useQuery } from '@apollo/client/react';
import {
  enumDisplaySpaChoices,
  FunderChoices,
  ShelterProgramChoices,
} from '@monorepo/react/shelter';
import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextField } from '../../../../../components/form/TextField';
import {
  CITY_COUNCIL_DISTRICT_OPTIONS,
  FUNDERS_OPTIONS,
  SHELTER_PROGRAMS_OPTIONS,
  SPA_OPTIONS,
  SUPERVISORIAL_DISTRICT_OPTIONS,
} from '../../../formOptions';
import {
  ShelterCitiesDocument,
  ShelterCitiesQuery,
  ShelterSpasDocument,
  ShelterSpasQuery,
} from '../api/__generated__/createShelterForm.generated';
import type { SectionProps } from '../types';
export const EcosystemInformationSection = memo(
  function EcosystemInformationSection({ data, onChange }: SectionProps) {
    const { data: shelterCities } = useQuery<ShelterCitiesQuery>(
      ShelterCitiesDocument
    );

    const { data: shelterSpas } =
      useQuery<ShelterSpasQuery>(ShelterSpasDocument);

    if (!shelterCities || !shelterSpas) return;

    return (
      <FormSection title="Ecosystem Information">
        <Dropdown
          label="City"
          placeholder="Select a city"
          options={shelterCities.shelterCities.results.map((o) => ({
            label: o.name,
            value: o.id,
          }))}
          value={
            data.city ? { label: data.city.name, value: data.city.id } : null
          }
          onChange={(option) => {
            onChange(
              'city',
              option ? { id: option.value, name: option.label } : null
            );
          }}
        />
        <Dropdown
          label="SPA (Service Planning Area)"
          placeholder="Select a SPA"
          options={SPA_OPTIONS}
          value={
            data.spa
              ? { label: enumDisplaySpaChoices[data.spa], value: data.spa }
              : null
          }
          onChange={(option) => onChange('spa', option ? option.value : null)}
        />
        <Dropdown
          label="City Council District"
          placeholder="Select a district"
          options={CITY_COUNCIL_DISTRICT_OPTIONS.filter(
            (o) => o.value !== null
          ).map((o) => ({ label: o.label, value: o.value as number }))}
          value={
            data.cityCouncilDistrict !== null
              ? {
                  label: String(data.cityCouncilDistrict),
                  value: data.cityCouncilDistrict,
                }
              : null
          }
          onChange={(option) => {
            onChange('cityCouncilDistrict', option ? option.value : null);
          }}
        />
        <Dropdown
          label="Supervisorial District"
          placeholder="Select a district"
          options={SUPERVISORIAL_DISTRICT_OPTIONS.filter(
            (o) => o.value !== null
          ).map((o) => ({ label: o.label, value: o.value as number }))}
          value={
            data.supervisorialDistrict !== null
              ? {
                  label: String(data.supervisorialDistrict),
                  value: data.supervisorialDistrict,
                }
              : null
          }
          onChange={(option) => {
            onChange('supervisorialDistrict', option ? option.value : null);
          }}
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
            if (!values.includes(FunderChoices.Other) && data.fundersOther) {
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
