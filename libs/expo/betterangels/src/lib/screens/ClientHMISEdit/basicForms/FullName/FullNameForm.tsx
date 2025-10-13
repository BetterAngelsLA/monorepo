import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { Controller, useFormContext } from 'react-hook-form';
import { enumDisplayHmisSuffix, enumHmisNameQuality } from '../../../../static';
import { TFormSchema, emptyState } from './formSchema';

type FullNameFormProps = {
  disabled?: boolean;
};

export function FullNameForm(props: FullNameFormProps) {
  const { disabled } = props;

  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TFormSchema>();

  const isDisabled = disabled || isSubmitting;

  return (
    <Form>
      <Form.Fieldset>
        <ControlledInput
          name="firstName"
          required
          control={control}
          disabled={isDisabled}
          label="First name"
          placeholder="Enter first name"
          onDelete={() => {
            setValue('firstName', emptyState.firstName);
          }}
          errorMessage={errors.firstName?.message}
        />

        <ControlledInput
          name="middleName"
          control={control}
          disabled={isDisabled}
          label="Middle Name"
          placeholder="Enter middle name"
          onDelete={() => {
            setValue('middleName', emptyState.middleName);
          }}
          errorMessage={errors.middleName?.message}
        />

        <ControlledInput
          name="lastName"
          required
          control={control}
          disabled={isDisabled}
          label="Last Name"
          placeholder="Enter last name"
          onDelete={() => {
            setValue('lastName', emptyState.lastName);
          }}
          errorMessage={errors.lastName?.message}
        />

        <Controller
          name="nameDataQuality"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isDisabled}
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
              disabled={isDisabled}
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
          disabled={isDisabled}
          label="Alias"
          placeholder={'Enter aliases'}
          onDelete={() => {
            setValue('alias', emptyState.alias);
          }}
          errorMessage={errors.alias?.message}
        />
      </Form.Fieldset>
    </Form>
  );
}
