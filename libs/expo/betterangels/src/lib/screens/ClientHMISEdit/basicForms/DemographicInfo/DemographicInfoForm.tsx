import {
  ControlledInput,
  Form,
  MultiSelect_V2,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { HmisGenderEnum, HmisRaceEnum } from '../../../../apollo';
import { enumHmisGender, enumHmisRace } from '../../../../static';
import {
  TDemographicInfoFormSchema,
  demographicInfoFormEmptyState as emptyState,
} from './formSchema';

export function DemographicInfoForm() {
  const {
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TDemographicInfoFormSchema>();

  const genderValues = watch('gender') || [];
  const raceValues = watch('raceEthnicity') || [];

  return (
    <Form>
      <Form.Field title="Gender">
        <MultiSelect_V2
          options={Object.entries(enumHmisGender).map(([key, value]) => ({
            id: key as HmisGenderEnum,
            label: value,
          }))}
          selected={genderValues.map((val) => ({
            id: val,
            label: enumHmisGender[val],
          }))}
          onChange={(selected) => {
            const selectedEnums = selected.map((item) => item.id);

            setValue('gender', selectedEnums);
          }}
          valueKey="id"
          labelKey="label"
        />
      </Form.Field>

      <Form.Field title="Race and Ethnicity">
        <MultiSelect_V2
          options={Object.entries(enumHmisRace).map(([key, value]) => ({
            id: key as HmisRaceEnum,
            label: value,
          }))}
          selected={raceValues.map((val) => ({
            id: val,
            label: enumHmisRace[val],
          }))}
          onChange={(selected) => {
            const selectedEnums = selected.map((item) => item.id);

            setValue('raceEthnicity', selectedEnums);
          }}
          valueKey="id"
          labelKey="label"
        />
      </Form.Field>

      <Form.Field title="Additional Race and Ethnicity">
        <ControlledInput
          name="additionalRaceEthnicity"
          control={control}
          disabled={isSubmitting}
          label="Additional race ethnicity"
          placeholder="Enter additional race ethnicity"
          onDelete={() => {
            setValue(
              'additionalRaceEthnicity',
              emptyState.additionalRaceEthnicity
            );
          }}
          errorMessage={errors.additionalRaceEthnicity?.message}
        />
      </Form.Field>

      <Form.Field title="Different Identity Text">
        <ControlledInput
          name="differentIdentityText"
          control={control}
          disabled={isSubmitting}
          label="Different identity text"
          placeholder="Enter different identity text"
          onDelete={() => {
            setValue('differentIdentityText', emptyState.differentIdentityText);
          }}
          errorMessage={errors.differentIdentityText?.message}
        />
      </Form.Field>
    </Form>
  );
}
