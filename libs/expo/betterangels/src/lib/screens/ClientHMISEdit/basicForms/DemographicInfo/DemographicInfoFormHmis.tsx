import {
  ControlledInput,
  Form,
  Input,
  LengthInputInches,
  MultiSelect_V2,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFormContext } from 'react-hook-form';
import {
  AdaAccommodationEnum,
  HmisGenderEnum,
  HmisRaceEnum,
} from '../../../../apollo';
import {
  enumDisplayAdaAccommodationEnum,
  enumDisplayEyeColor,
  enumDisplayHairColor,
  enumDisplayMaritalStatus,
  enumDisplayPronoun,
  enumHmisGender,
  enumHmisRace,
} from '../../../../static';
import {
  TDemographicInfoFormSchema,
  demographicInfoFormEmptyState,
  demographicInfoFormEmptyState as emptyState,
} from './formSchema';

export function DemographicInfoFormHmis() {
  const {
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting, dirtyFields, isSubmitted },
  } = useFormContext<TDemographicInfoFormSchema>();

  const genderValues = watch('gender') || [];
  const raceValues = watch('raceEthnicity') || [];
  const adaAccommodationValues = watch('adaAccommodation') || [];

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
            // Re-run schema to revalidate gender/text combo error
            trigger(['gender', 'genderIdentityText']);
          }}
          valueKey="id"
          labelKey="label"
        />
      </Form.Field>

      <Form.Field title="Different Identity Text">
        <Controller
          name="genderIdentityText"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Input
              onChangeText={(next) => {
                onChange(next);
                // Re-run schema to revalidate gender/text combo error
                trigger(['gender', 'genderIdentityText']);
              }}
              value={value}
              disabled={isSubmitting}
              placeholder="Enter gender identity text"
              errorMessage={
                dirtyFields.genderIdentityText ||
                dirtyFields.gender ||
                isSubmitted
                  ? errors.genderIdentityText?.message
                  : undefined
              }
              onDelete={() => {
                setValue('genderIdentityText', emptyState.genderIdentityText);
                trigger(['gender', 'genderIdentityText']);
              }}
            />
          )}
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

      <Form.Field title="Additional Race and Ethnicity Detail">
        <ControlledInput
          name="additionalRaceEthnicityDetail"
          control={control}
          disabled={isSubmitting}
          placeholder="Enter additional race and ethnicity detail"
          onDelete={() => {
            setValue(
              'additionalRaceEthnicityDetail',
              emptyState.additionalRaceEthnicityDetail
            );
          }}
          errorMessage={errors.additionalRaceEthnicityDetail?.message}
        />
      </Form.Field>

      <Form.Field title="Pronouns">
        <Controller
          name="pronouns"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              placeholder="Select pronouns"
              maxRadioItems={0}
              items={Object.entries(enumDisplayPronoun).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.pronouns?.message}
            />
          )}
        />
      </Form.Field>

      <Form.Field title="Place of Birth">
        <ControlledInput
          name="placeOfBirth"
          placeholder="Enter place of birth"
          control={control}
          disabled={isSubmitting}
          onDelete={() =>
            setValue('placeOfBirth', demographicInfoFormEmptyState.placeOfBirth)
          }
          error={!!errors.placeOfBirth}
          errorMessage={errors.placeOfBirth?.message}
        />
      </Form.Field>

      <Form.Field title="Height">
        <Controller
          name="heightInInches"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LengthInputInches
              valueInches={value ?? undefined}
              onChangeInches={onChange}
            />
          )}
        />
      </Form.Field>

      <Form.Field title="Eye Color">
        <Controller
          name="eyeColor"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              placeholder="Select eye color"
              items={Object.entries(enumDisplayEyeColor).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) =>
                onChange(value || demographicInfoFormEmptyState.eyeColor)
              }
              error={errors.eyeColor?.message}
            />
          )}
        />
      </Form.Field>

      <Form.Field title="Hair Color">
        <Controller
          name="hairColor"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              placeholder="Select hair color"
              items={Object.entries(enumDisplayHairColor).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) =>
                onChange(value || demographicInfoFormEmptyState.hairColor)
              }
              error={errors.hairColor?.message}
            />
          )}
        />
      </Form.Field>

      <Form.Field title="Marital Status">
        <Controller
          name="maritalStatus"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              placeholder="Select marital status"
              items={Object.entries(enumDisplayMaritalStatus).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) =>
                onChange(value || demographicInfoFormEmptyState.maritalStatus)
              }
              error={errors.maritalStatus?.message}
            />
          )}
        />
      </Form.Field>

      <Form.Field title="Physical Description">
        <ControlledInput
          name="physicalDescription"
          placeholder="Enter physical description"
          control={control}
          disabled={isSubmitting}
          onDelete={() =>
            setValue(
              'physicalDescription',
              demographicInfoFormEmptyState.physicalDescription
            )
          }
          error={!!errors.physicalDescription}
          errorMessage={errors.physicalDescription?.message}
        />
      </Form.Field>

      <Form.Field title="ADA Accommodation">
        <MultiSelect_V2
          options={Object.entries(enumDisplayAdaAccommodationEnum).map(
            ([key, value]) => ({
              id: key as AdaAccommodationEnum,
              label: value,
            })
          )}
          selected={adaAccommodationValues.map((val) => ({
            id: val,
            label: enumDisplayAdaAccommodationEnum[val],
          }))}
          onChange={(selected) => {
            const selectedEnums = selected.map((item) => item.id);

            setValue('adaAccommodation', selectedEnums);
          }}
          valueKey="id"
          labelKey="label"
        />
      </Form.Field>
    </Form>
  );
}
