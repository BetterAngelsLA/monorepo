import { zodResolver } from '@hookform/resolvers/zod';
import { useMutationWithErrors } from '@monorepo/apollo';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSnackbar } from '../../hooks';
import { toHmisNameQualityInt, toHmisSuffixEnumInt } from '../../static';
import {
  FullNameFormHmis,
  FullNameFormSchema,
  TFullNameFormSchema,
  fullNameFormEmptyState,
} from '../ClientHMISEdit/basicForms';
import {
  FALLBACK_NAME_DATA_QUALITY_INT,
  FALLBACK_NAME_SUFFIX_INT,
} from '../ClientHMISEdit/constants';
import { CreateHmisClientProfileDocument } from './__generated__/createHmisClient.generated';

export function CreateClientProfileHMIS() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisClientProfileMutation] = useMutationWithErrors(
    CreateHmisClientProfileDocument
  );

  const formMethods = useForm<TFullNameFormSchema>({
    resolver: zodResolver(FullNameFormSchema),
    defaultValues: fullNameFormEmptyState,
  });

  const {
    handleSubmit,
    // setError,
    formState: { isSubmitting },
  } = formMethods;

  // const formKeys = Object.keys(fullNameFormEmptyState);

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

      const { data } = await createHmisClientProfileMutation({
        variables: {
          clientInput: {
            firstName,
            lastName,
            nameQuality:
              toHmisNameQualityInt(nameQuality) ??
              FALLBACK_NAME_DATA_QUALITY_INT,
          },
          clientSubItemsInput: {
            nameMiddle,
            alias,
            nameSuffix:
              toHmisSuffixEnumInt(nameSuffix) ?? FALLBACK_NAME_SUFFIX_INT,
          },
        },
        errorPolicy: 'all',
      });

      const result = data?.createHmisClientProfile;

      if (!result) {
        throw new Error('missing createHmisClientProfile response');
      }

      // if (result?.__typename === 'HmisCreateClientError') {
      //   const { message: hmisErrorMessage } = result;

      //   const { status, fieldErrors = [] } =
      //     extractHMISErrors(hmisErrorMessage) || {};

      //   // handle unprocessable_entity errors and exit
      //   if (status === 422) {
      //     const formFieldErrors = fieldErrors.filter(({ field }) =>
      //       formKeys.includes(field)
      //     );

      //     applyOperationFieldErrors(formFieldErrors, setError);

      //     return;
      //   }

      //   // HmisCreateClientError exists but not 422
      //   // throw generic error
      //   throw new Error(hmisErrorMessage);
      // }

      if (result?.__typename !== 'HmisClientProfileType') {
        throw new Error('invalid createHmisClientProfile response');
      }

      const { hmisId } = result;

      router.replace(`/client/${hmisId}`);
    } catch (error) {
      console.error('createHmisClientProfileMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <FormProvider {...formMethods}>
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
