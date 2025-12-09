import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import {
  UpdateClientProfileInput,
  extractResponseExtensions,
} from '../../../apollo';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { isValidClientProfileSectionEnum } from '../../../screenRouting';
import {
  GetClientProfileDocument,
  UpdateClientProfileDocument,
} from './__generated__/clientProfile.generated';
import { config } from './config';
import { extractClientFormData } from './extractClientFormData';
import { FormStateMapping, FormValues, IClientProfileForms } from './types';

export default function ClientProfileForm(props: IClientProfileForms) {
  const { componentName, id } = props;

  const {
    data: fetchProfileData,
    error: fetchProfileError,
    loading: isFetchingProfile,
    refetch,
  } = useQuery(GetClientProfileDocument, {
    variables: { id },
  });

  const [updateClientProfile, { loading: isUpdating }] = useMutation(
    UpdateClientProfileDocument
  );

  const methods = useForm<FormValues>({
    defaultValues: {
      id,
    },
  });

  const navigation = useNavigation();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  if (!isValidClientProfileSectionEnum(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const validComponentName = componentName as keyof FormStateMapping;

  const { content, title: screenTitle } = config[validComponentName];

  useLayoutEffect(() => {
    if (screenTitle) {
      navigation.setOptions({ title: screenTitle });
    }
  }, [screenTitle, navigation]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      if (!fetchProfileData || !('clientProfile' in fetchProfileData)) {
        return;
      }

      const inputs = toUpdateClienProfileInputs(id, values);

      if (!inputs) {
        return;
      }

      if ('socialMediaProfiles' in values) {
        inputs.socialMediaProfiles =
          values.socialMediaProfiles?.filter((item) => item.platformUserId) ||
          [];

        inputs.phoneNumbers =
          values.phoneNumbers?.filter((item) => item.number) || [];
      }

      const { error } = await updateClientProfile({
        variables: {
          data: inputs,
        },
        errorPolicy: 'all',
      });

      // handle fieldErrors and return if present
      if (CombinedGraphQLErrors.is(error)) {
        // TODO: convert to use extractExtensionFieldErrors
        const fieldErrors = extractResponseExtensions(error);

        if (fieldErrors?.length) {
          applyManualFormErrors(fieldErrors, methods.setError);

          return;
        }
      }

      // throw unhandled errors
      if (error) {
        throw new Error(error.message);
      }

      // Ensure the refetch completes before navigating away.
      // In apollo client v4, if we navigate immediately,
      // the query unmounts and refetch is cancelled.
      await refetch();

      router.replace(`/client/${id}?openCard=${validComponentName}`);
    } catch (err) {
      console.error(`[updateClientProfile] error: ${err}`);

      showSnackbar({
        message: 'Sorry, there was an error updating this profile.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (!fetchProfileData || !('clientProfile' in fetchProfileData) || !id) {
      return;
    }

    const formData = extractClientFormData(
      validComponentName,
      fetchProfileData.clientProfile
    );

    methods.reset(formData);
  }, [fetchProfileData, id]);

  if (isFetchingProfile) {
    return <LoadingView />;
  }

  if (fetchProfileError) {
    console.error(fetchProfileError);

    showSnackbar({
      message: 'Something went wrong. Please try again.',
      type: 'error',
    });
  }

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: methods.handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isUpdating,
        }}
      >
        {content}
      </Form.Page>
    </FormProvider>
  );
}

function toUpdateClienProfileInputs(
  id: string,
  values: FormValues
): UpdateClientProfileInput | null {
  if (!values || !id) {
    return null;
  }

  const updatedInputs: UpdateClientProfileInput = { id };

  // convert dateOfBirth to date string and remove time, or null if cleared
  if ('dateOfBirth' in values) {
    if (values.dateOfBirth) {
      updatedInputs.dateOfBirth = values.dateOfBirth
        .toISOString()
        .split('T')[0] as unknown as Date;
    } else {
      updatedInputs.dateOfBirth = null;
    }
  }

  // profilePhoto is updated directly within component
  if ('profilePhoto' in values) {
    delete values.profilePhoto;
  }

  return {
    ...values,
    ...updatedInputs,
  };
}
