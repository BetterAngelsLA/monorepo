import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumHmisDobQuality,
  enumHmisVeteranStatusEnum,
} from '../../../../static';
import {
  TPersonalInfoFormSchema,
  personalInfoFormEmptyState,
} from './formSchema';

export function PersonalInfoFormHmis() {
  const {
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<TPersonalInfoFormSchema>();

  const dobQuality = watch('dobQuality');

  const isDobDisabled =
    dobQuality === 'DONT_KNOW' ||
    dobQuality === 'NO_ANSWER' ||
    dobQuality === 'NOT_COLLECTED' ||
    dobQuality === '';

  useEffect(() => {
    if (isDobDisabled) {
      setValue('birthDate', null);
    }
  }, [isDobDisabled, setValue]);

  return (
    <Form>
      <Form.Fieldset>
        <DatePicker
          name="birthDate"
          control={control}
          type="numeric"
          label="Date of Birth"
          placeholder="Enter date"
          disabled={isDobDisabled || isSubmitting}
          validRange={{
            endDate: new Date(),
            startDate: new Date('1900-01-01'),
          }}
        />
        <Controller
          name="dobQuality"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="DOB Data Quality"
              placeholder="Select quality"
              maxRadioItems={0}
              items={Object.entries(enumHmisDobQuality).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.dobQuality?.message}
            />
          )}
        />
        <Controller
          name="veteran"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Veteran Status"
              placeholder="Select status"
              maxRadioItems={0}
              items={Object.entries(enumHmisVeteranStatusEnum).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.veteran?.message}
            />
          )}
        />

        <ControlledInput
          name="californiaId"
          label="CA ID#"
          placeholder="Enter CA ID #"
          control={control}
          disabled={isSubmitting}
          autoCapitalize="characters"
          onDelete={() =>
            setValue('californiaId', personalInfoFormEmptyState.californiaId)
          }
          error={!!errors.californiaId}
          errorMessage={errors.californiaId?.message}
        />

        <Controller
          name="livingSituation"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Living Situation"
              placeholder="Select situation"
              maxRadioItems={0}
              items={Object.entries(enumDisplayLivingSituation).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.livingSituation?.message}
            />
          )}
        />

        <Controller
          name="preferredLanguage"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Preferred Language"
              placeholder="Select language"
              maxRadioItems={0}
              items={Object.entries(enumDisplayLanguage).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.preferredLanguage?.message}
            />
          )}
        />
      </Form.Fieldset>
    </Form>
  );
}
