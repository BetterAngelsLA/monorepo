import { zodResolver } from '@hookform/resolvers/zod';
import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { extractHMISErrors } from '../../apollo';
import { applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
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

      const { firstName, lastName, middleName } = formData;

      const { data, errors } = await createHMISClientMutation({
        variables: {
          clientInput: {
            firstName,
            lastName,
          },
          clientSubItemsInput: {
            middleName,
          },
        },
        errorPolicy: 'all',
      });

      const result = data?.hmisCreateClient;

      if (!result) {
        throw new Error(`[createHMISClientMutation error]: invalid response`);
      }

      if (result?.__typename === 'HmisCreateClientError') {
        const { message: hmisErrorMessage } = result;

        const hmisErrors = extractHMISErrors(hmisErrorMessage);

        if (hmisErrors?.status === 422) {
          const fieldErrorMessages = hmisErrors?.messages || [];

          const fieldErrors = Object.entries(fieldErrorMessages)
            .filter(([fieldName, _fieldMessages]) =>
              formKeys.includes(fieldName)
            )
            .map(([fieldName, fieldMessages]) => {
              const errMsg = fieldMessages.join(', ');
              return {
                field: fieldName,
                message: errMsg,
              };
            });

          applyOperationFieldErrors(fieldErrors, setError);

          return;
        }

        throw new Error(`[HmisCreateClientError]: ${hmisErrorMessage}`);
      }
    } catch (error) {
      console.error('Task mutation error:', error);

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
        </Form.Fieldset>
      </Form>
    </Form.Page>
  );
}
