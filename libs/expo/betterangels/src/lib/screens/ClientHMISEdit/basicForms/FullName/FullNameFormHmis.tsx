import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFormContext } from 'react-hook-form';
import { enumDisplayHmisSuffix, enumHmisNameQuality } from '../../../../static';
import { TFullNameFormSchema, fullNameFormEmptyState } from './formSchema';

export function FullNameFormHmis() {
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TFullNameFormSchema>();

  return (
    <Form>
      <Form.Fieldset>
        <ControlledInput
          name="firstName"
          required
          control={control}
          disabled={isSubmitting}
          label="First name"
          placeholder="Enter first name"
          onDelete={() => {
            setValue('firstName', fullNameFormEmptyState.firstName);
          }}
          errorMessage={errors.firstName?.message}
        />

        <ControlledInput
          name="nameMiddle"
          control={control}
          disabled={isSubmitting}
          label="Middle Name"
          placeholder="Enter middle name"
          onDelete={() => {
            setValue('nameMiddle', fullNameFormEmptyState.nameMiddle);
          }}
          errorMessage={errors.nameMiddle?.message}
        />

        <ControlledInput
          name="lastName"
          required
          control={control}
          disabled={isSubmitting}
          label="Last Name"
          placeholder="Enter last name"
          onDelete={() => {
            setValue('lastName', fullNameFormEmptyState.lastName);
          }}
          errorMessage={errors.lastName?.message}
        />

        <Controller
          name="nameDataQuality"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Name Data Quality"
              placeholder="Select quality"
              maxRadioItems={0}
              items={Object.entries(enumHmisNameQuality).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.nameDataQuality?.message}
            />
          )}
        />

        <Controller
          name="nameSuffix"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Suffix"
              placeholder="Select suffix"
              maxRadioItems={0}
              items={Object.entries(enumDisplayHmisSuffix).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.nameSuffix?.message}
            />
          )}
        />

        <ControlledInput
          name="alias"
          control={control}
          disabled={isSubmitting}
          label="Alias"
          placeholder={'Enter aliases'}
          onDelete={() => {
            setValue('alias', fullNameFormEmptyState.alias);
          }}
          errorMessage={errors.alias?.message}
        />
      </Form.Fieldset>
    </Form>
  );
}
