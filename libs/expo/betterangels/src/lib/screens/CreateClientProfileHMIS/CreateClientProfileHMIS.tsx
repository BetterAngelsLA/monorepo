import { zodResolver } from '@hookform/resolvers/zod';
import {
  ControlledInput,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { extractHMISErrors } from '../../apollo';
import { applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import { enumHmisNameQuality } from '../../static';
import { useCreateHmisClientMutation } from './__generated__/createHmisClient.generated';
import { FormSchema, TFormSchema, emptyState } from './formSchema';

export function CreateClientProfileHMIS() {
  const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [createHMISClientMutation] = useCreateHmisClientMutation();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: emptyState,
  });

  const formKeys = FormSchema.keyof().options as string[];

  const onSubmit: SubmitHandler<TFormSchema> = async (
    formData: TFormSchema
  ) => {
    try {
      setDisabled(true);

      const { firstName, lastName, middleName, nameDataQuality, alias } =
        formData;

      const { data } = await createHMISClientMutation({
        variables: {
          clientInput: {
            firstName,
            lastName,
            // nameDataQuality, TODO: fix enum treatment
          },
          clientSubItemsInput: {
            middleName,
            alias,
          },
        },
        errorPolicy: 'all',
      });

      const result = data?.hmisCreateClient;

      if (!result) {
        throw new Error('missing hmisCreateClient response');
      }

      if (result?.__typename === 'HmisCreateClientError') {
        const { message: hmisErrorMessage } = result;

        const { status, fieldErrors = [] } =
          extractHMISErrors(hmisErrorMessage) || {};

        console.log(JSON.stringify(fieldErrors, null, 2));

        // handle unprocessable_entity errors and exit
        if (status === 422) {
          const formFieldErrors = fieldErrors.filter(({ field }) =>
            formKeys.includes(field)
          );

          applyOperationFieldErrors(formFieldErrors, setError);

          return;
        }

        // HmisCreateClientError exists but not 422
        // throw generic error
        throw new Error(hmisErrorMessage);
      }

      if (result?.__typename !== 'HmisClientType') {
        throw new Error('invalid hmisCreateClient response');
      }

      const { uniqueIdentifier } = result;

      // TODO: decide on HMIS PK and handle /client/${uniqueIdentifier route
      // router.replace(`/client/${uniqueIdentifier}`);
      // temporary Snackbar message:
      showSnackbar({
        message: `Created HMIS client with uniqueIdentifier: [${uniqueIdentifier}]. But cannot redirect yet.`,
        type: 'success',
      });
    } catch (error) {
      console.error('createHMISClientMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setDisabled(false);
    }
  };

  return (
    <Form.Page
      actionProps={{
        onSubmit: handleSubmit(onSubmit),
        onLeftBtnClick: router.back,
        disabled,
      }}
    >
      <Form>
        <Form.Fieldset>
          <ControlledInput
            required
            control={control}
            disabled={disabled}
            label={'First name'}
            name={'firstName'}
            placeholder={'Enter first name'}
            onDelete={() => {
              setValue('firstName', emptyState.firstName);
            }}
            errorMessage={errors.firstName?.message}
          />

          <ControlledInput
            control={control}
            disabled={disabled}
            label={'Middle Name'}
            name={'middleName'}
            placeholder={'Enter middle name'}
            onDelete={() => {
              setValue('middleName', emptyState.middleName);
            }}
            errorMessage={errors.middleName?.message}
          />

          <ControlledInput
            required
            control={control}
            disabled={disabled}
            label={'Last Name'}
            name={'lastName'}
            placeholder={'Enter last name'}
            onDelete={() => {
              setValue('lastName', emptyState.lastName);
            }}
            errorMessage={errors.lastName?.message}
          />

          <Controller
            name="nameDataQuality"
            control={control}
            render={({ field }) => (
              <SingleSelect
                allowSelectNone={true}
                disabled={disabled}
                label="Name Data Quality"
                placeholder="Select quality"
                maxRadioItems={0}
                items={Object.entries(enumHmisNameQuality).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value || '')}
                error={errors.nameDataQuality?.message}
              />
            )}
          />

          <ControlledInput
            control={control}
            disabled={disabled}
            label={'Alias'}
            name={'aliases'}
            placeholder={'Enter aliases'}
            onDelete={() => {
              setValue('alias', emptyState.alias);
            }}
            errorMessage={errors.alias?.message}
          />
        </Form.Fieldset>
      </Form>
    </Form.Page>
  );
}
