import { DemographicChoices, ShelterChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown/Dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import {
  DEMOGRAPHICS_OPTIONS,
  SHELTER_TYPES_OPTIONS,
  SPECIAL_SITUATION_OPTIONS,
} from '../../../formOptions';
import type { SectionProps } from '../types';

const DROPDOWN_OTHER_VALUE = '__dropdown_other__';

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

export const SummaryInformationSection = memo(
  function SummaryInformationSection({
    data,
    onChange,
    errors,
    isTouched,
  }: SectionProps) {
    return (
      <FormSection
        title="Summary Information"
        className="rounded-none border-0 bg-transparent p-0"
        contentClassName="space-y-6 py-6"
        titleClassName=""
      >
        <Dropdown
          label="Demographics Served"
          placeholder="Please select"
          options={DEMOGRAPHICS_OPTIONS}
          value={selectedOptions(DEMOGRAPHICS_OPTIONS, data.demographics)}
          onChange={(values) => {
            const nextValues = toValues<DemographicChoices>(
              values,
              DemographicChoices.Other
            );
            onChange('demographics', nextValues);
            if (
              !nextValues.includes(DemographicChoices.Other) &&
              data.demographicsOther
            ) {
              onChange('demographicsOther', '');
            }
          }}
          onOtherTextChange={(text) => onChange('demographicsOther', text)}
          isMulti
          required
        />

        <Dropdown
          label="Special Situation Restrictions"
          placeholder="Please select"
          options={SPECIAL_SITUATION_OPTIONS}
          onChange={(values) =>
            onChange('specialSituationRestrictions', toValues(values))
          }
          value={selectedOptions(
            SPECIAL_SITUATION_OPTIONS,
            data.specialSituationRestrictions
          )}
          isMulti
          required
        />

        <Dropdown
          label="Shelter Type"
          placeholder="Please select"
          options={SHELTER_TYPES_OPTIONS}
          value={selectedOptions(SHELTER_TYPES_OPTIONS, data.shelterTypes)}
          onChange={(values) => {
            const nextValues = toValues<ShelterChoices>(
              values,
              ShelterChoices.Other
            );
            onChange('shelterTypes', nextValues);
            if (
              !nextValues.includes(ShelterChoices.Other) &&
              data.shelterTypesOther
            ) {
              onChange('shelterTypesOther', '');
            }
          }}
          onOtherTextChange={(text) => onChange('shelterTypesOther', text)}
          isMulti
          required
        />
        <Input
          id="shelter-description"
          variant="paragraph"
          label="Description"
          placeholder="Describe your shelter"
          value={data.description}
          onChange={(event) => onChange('description', event.target.value)}
          error={errors.description}
          isTouched={isTouched}
        />
      </FormSection>
    );
  }
);
