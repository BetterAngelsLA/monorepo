import { zodResolver } from '@hookform/resolvers/zod';
import { useMutationWithErrors } from '@monorepo/apollo';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSnackbar } from '../../hooks';

import { extractExtensionErrors } from '../../apollo';
import { applyManualFormErrors } from '../../errors';
import {
  FullNameFormHmis,
  FullNameFormSchema,
  TFullNameFormSchema,
  fullNameFormEmptyState,
} from '../ClientHMISEdit/basicForms';
import {
  FALLBACK_NAME_DATA_QUALITY,
  FALLBACK_NAME_SUFFIX,
} from '../ClientHMISEdit/constants';
import { CreateHmisClientProfileDocument } from './__generated__/createHmisClient.generated';

export function CreateClientProfileHMIS() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisClientProfileMutation] = useMutationWithErrors(
    CreateHmisClientProfileDocument
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

      if (!createResponse) {
        throw new Error('missing createHmisClientProfile response');
      }

      const errorViaExtensions = extractExtensionErrors(createResponse);

      if (errorViaExtensions) {
        applyManualFormErrors(errorViaExtensions, setError);

        return;
      }

      const otherErrors = createResponse.errors?.[0];

      if (otherErrors) {
        throw otherErrors.message;
      }

      const result = createResponse.data?.createHmisClientProfile;

      if (result?.__typename === 'HmisClientProfileType') {
        router.replace(`/client/${result.id}`);
      } else {
        console.log('Unexpected result: ', result);
        showSnackbar({
          message: `Something went wrong!`,
          type: 'error',
        });
        router.replace(`/clients`);
      }
    } catch (error) {
      console.error('createHmisClientProfileMutation error:', error);

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
