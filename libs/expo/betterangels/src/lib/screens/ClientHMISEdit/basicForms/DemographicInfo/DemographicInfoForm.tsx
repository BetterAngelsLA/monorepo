// import { TextBold } from '@monorepo/expo/shared/ui-components';
// import { View } from 'react-native';

// export function DemographicInfoForm() {
//   return (
//     <View>
//       <TextBold>DEMO INFO FORM</TextBold>
//     </View>
//   );
// }

import {
  ControlledInput,
  Form,
  MultiSelect_V2,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import {
  HmisGenderEnum,
  HmisRaceEnum,
  HmisUpdateClientSubItemsInput,
} from '../../../../apollo';
import { enumHmisGender, enumHmisRace } from '../../../../static';
import {
  TDemographicInfoFormSchema,
  demographicInfoFormEmptyState as emptyState,
} from './formSchema';

// OURS
// gender
// Pronouns
// Race
// Place of Birth
// Height
// Eye Color
// Hair Color
// Marital Status
// Physical Description
// ADA Accommodation

// const inputs: HmisUpdateClientSubItemsInput = {
//   middleName: client.data?.middleName || '',
//   nameSuffix: toNameSuffixInput(client.data?.nameSuffix),
//   alias: values.alias || '',
//   additionalRaceEthnicity: values.additionalRaceEthnicity || '',
//   differentIdentityText: values.differentIdentityText || '',
//   gender: [FALLBACK_GENDER_INT],
//   raceEthnicity: [FALLBACK_RACE_ETHNICITY_INT],
//   veteranStatus: FALLBACK_VETERAN_STATUS_INT,
// };

export function DemographicInfoForm() {
  const {
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TDemographicInfoFormSchema>();

  const genderValues = watch('gender') || [];
  const raceValues = watch('raceEthnicity') || [];

  // HMIS
  // gender: Array<Scalars['Int']['input']>;
  // raceEthnicity: Array<Scalars['Int']['input']>;
  // additionalRaceEthnicity: Scalars['String']['input'];
  // differentIdentityText: Scalars['String']['input'];

  const inputs: Partial<HmisUpdateClientSubItemsInput> = {};

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
