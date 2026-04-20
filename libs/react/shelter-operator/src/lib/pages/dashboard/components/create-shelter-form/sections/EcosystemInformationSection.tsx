import { FunderChoices, ShelterProgramChoices } from '@monorepo/react/shelter';
import { memo, useState } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown';
import { FormSection } from '../../../../../components/form/FormSection';
import {
  CITY_COUNCIL_DISTRICT_OPTIONS,
  FUNDERS_OPTIONS,
  LA_CITIES_OPTIONS,
  SHELTER_PROGRAMS_OPTIONS,
  SPA_OPTIONS,
  SUPERVISORIAL_DISTRICT_OPTIONS,
} from '../../../formOptions';
import type { SectionProps } from '../types';

const DROPDOWN_OTHER_VALUE = '__dropdown_other__';

const COUNTY_OPTIONS = [{ value: 'LA_COUNTY', label: 'Los Angeles County' }];

const selectedOptions = <T extends string>(
  options: { value: T; label: string }[],
  values: T[]
) => options.filter((option) => values.includes(option.value));

const toValues = <T extends string>(
  values: Array<{ value: string; label: string }> | null,
  mappedOtherValue?: T
) => {
  const next = new Set<T>();

  (values ?? []).forEach((option) => {
    if (option.value === DROPDOWN_OTHER_VALUE) {
      if (mappedOtherValue) {
        next.add(mappedOtherValue);
      }
      return;
    }
    next.add(option.value as T);
  });

  return Array.from(next);
};

export const EcosystemInformationSection = memo(
  function EcosystemInformationSection({ data, onChange }: SectionProps) {
    const [county, setCounty] = useState<{
      value: string;
      label: string;
    } | null>(null);

    return (
      <FormSection
        title="Ecosystem Information"
        className="rounded-none border-0 bg-transparent p-0"
        contentClassName="space-y-6 py-6"
        titleClassName=""
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Dropdown
            label="Cities"
            placeholder="Please select"
            options={LA_CITIES_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            value={selectedOptions(
              LA_CITIES_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              })),
              data.cities
            )}
            onChange={(values) => onChange('cities', toValues(values))}
            isMulti
          />

          <Dropdown
            label="County"
            placeholder="Please select"
            options={COUNTY_OPTIONS}
            value={county}
            onChange={(value) => setCounty(value)}
          />
        </div>

        <Dropdown
          label="Service Planning Area"
          placeholder="Please select"
          options={SPA_OPTIONS}
          value={selectedOptions(SPA_OPTIONS, data.spa)}
          onChange={(values) => onChange('spa', toValues(values))}
          isMulti
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Dropdown
            label="City Council District"
            placeholder="Please select"
            options={CITY_COUNCIL_DISTRICT_OPTIONS.filter(
              (option) => option.value !== null
            ).map((option) => ({
              label: option.label,
              value: option.value as number,
            }))}
            value={
              data.cityCouncilDistrict !== null
                ? {
                    label: String(data.cityCouncilDistrict),
                    value: data.cityCouncilDistrict,
                  }
                : null
            }
            onChange={(option) =>
              onChange('cityCouncilDistrict', option ? option.value : null)
            }
          />

          <Dropdown
            label="Supervisorial District"
            placeholder="Please select"
            options={SUPERVISORIAL_DISTRICT_OPTIONS.filter(
              (option) => option.value !== null
            ).map((option) => ({
              label: option.label,
              value: option.value as number,
            }))}
            value={
              data.supervisorialDistrict !== null
                ? {
                    label: String(data.supervisorialDistrict),
                    value: data.supervisorialDistrict,
                  }
                : null
            }
            onChange={(option) =>
              onChange('supervisorialDistrict', option ? option.value : null)
            }
          />
        </div>

        <Dropdown
          label="Shelter Programs"
          placeholder="Please select"
          options={SHELTER_PROGRAMS_OPTIONS}
          value={selectedOptions(
            SHELTER_PROGRAMS_OPTIONS,
            data.shelterPrograms
          )}
          onChange={(values) => {
            const nextValues = toValues<ShelterProgramChoices>(
              values,
              ShelterProgramChoices.Other
            );
            onChange('shelterPrograms', nextValues);
            if (
              !nextValues.includes(ShelterProgramChoices.Other) &&
              data.shelterProgramsOther
            ) {
              onChange('shelterProgramsOther', '');
            }
          }}
          onOtherTextChange={(text) => onChange('shelterProgramsOther', text)}
          isMulti
        />

        <Dropdown
          label="Funders"
          placeholder="Please select"
          options={FUNDERS_OPTIONS}
          value={selectedOptions(FUNDERS_OPTIONS, data.funders)}
          onChange={(values) => {
            const nextValues = toValues<FunderChoices>(
              values,
              FunderChoices.Other
            );
            onChange('funders', nextValues);
            if (
              !nextValues.includes(FunderChoices.Other) &&
              data.fundersOther
            ) {
              onChange('fundersOther', '');
            }
          }}
          onOtherTextChange={(text) => onChange('fundersOther', text)}
          isMulti
        />
      </FormSection>
    );
  }
);
