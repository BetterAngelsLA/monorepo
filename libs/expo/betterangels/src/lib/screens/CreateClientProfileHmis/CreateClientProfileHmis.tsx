import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSnackbar } from '../../hooks';

import { useMutation } from '@apollo/client/react';
import { extractOperationFieldErrors } from '../../apollo/graphql/response/extractOperationFieldErrors';
import { applyOperationFieldErrors } from '../../errors';
import {
  FullNameFormFieldNames,
  FullNameFormHmis,
  FullNameFormSchema,
  TFullNameFormSchema,
  fullNameFormEmptyState,
} from '../ClientEditHmis/basicForms';
import {
  FALLBACK_NAME_DATA_QUALITY,
  FALLBACK_NAME_SUFFIX,
} from '../ClientEditHmis/constants';
import { CreateClientProfileHmisDocument } from './__generated__/createClientHmis.generated';

export function CreateClientProfileHmis() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisClientProfileMutation] = useMutation(
    CreateClientProfileHmisDocument
  );

  const methods = useForm<TFullNameFormSchema>({
    resolver: zodResolver(FullNameFormSchema),
    defaultValues: fullNameFormEmptyState,
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods;

  const onSubmit: SubmitHandler<TFullNameFormSchema> = async (formData) => {
    try {
      const {
        firstName,
        lastName,
        nameMiddle,
        nameQuality,
        alias,
        nameSuffix,
      } = formData;

      const createResponse = await createHmisClientProfileMutation({
        variables: {
          data: {
            firstName,
            lastName,
            nameMiddle,
            alias,
            nameSuffix: nameSuffix ?? FALLBACK_NAME_SUFFIX,
            nameQuality: nameQuality ?? FALLBACK_NAME_DATA_QUALITY,
          },
        },
        errorPolicy: 'all',
      });

      const { data, error } = createResponse;

      // if form field errors: handle and exit
      const fieldErrors = extractOperationFieldErrors({
        data,
        dataKey: 'createHmisClientProfile',
        fieldNames: [...FullNameFormFieldNames],
      });

      if (fieldErrors.length) {
        applyOperationFieldErrors(fieldErrors, setError);
        return;
      }

      // non-validation error: throw
      if (error) {
        throw new Error(error.message);
      }

      const result = data?.createHmisClientProfile;

      if (result?.__typename !== 'HmisClientProfileType') {
        throw new Error('typename is not HmisClientProfileType');
      }

      router.replace(`/client/${result.id}`);
    } catch (error) {
      console.error('[createHmisClientProfileMutation] error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isSubmitting,
        }}
      >
        <FullNameFormHmis />
      </Form.Page>
    </FormProvider>
  );
}
