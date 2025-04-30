import { FetchResult } from '@apollo/client';
import { Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { extractExtensionErrors } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import { TShowSnackbar } from '../../../../../providers/snackbar/SnackbarProvider';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { useGetClientProfileLazyQuery } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import {
  CreateClientContactMutation,
  UpdateClientContactMutation,
  useCreateClientContactMutation,
  useUpdateClientContactMutation,
} from './__generated__/clientContact.generated';
import { defaultFormState, toFormState } from './toFormState';
import { TClientContactFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
  router: Router;
  showSnackbar: (props: TShowSnackbar) => void;
};

export function useClientContactForm(props: TProps) {
  const { clientProfile, relationId, router, showSnackbar } = props;

  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    formState: { errors, isValid: formIsValid, isSubmitted },
    handleSubmit,
    setError,
    setValue,
    clearErrors,
  } = useForm<TClientContactFormState>({ defaultValues: defaultFormState });

  useEffect(() => {
    const { name, email, phoneNumber, mailingAddress, relationshipToClient } =
      toFormState({ clientProfile, relationId });
    setValue('name', name);
    setValue('email', email);
    setValue('phoneNumber', phoneNumber);
    setValue('mailingAddress', mailingAddress);
    setValue('relationshipToClient', relationshipToClient);
  }, [clientProfile, relationId, setValue, toFormState]);

  const [email, phoneNumber, mailingAddress, relationshipToClient] = useWatch({
    control,
    name: ['email', 'phoneNumber', 'mailingAddress', 'relationshipToClient'],
  });

  const oneOfMissingError = !email && !phoneNumber && !mailingAddress;
  const isError = oneOfMissingError || !relationshipToClient;

  const [createContact] = useCreateClientContactMutation();
  const [updateContact] = useUpdateClientContactMutation();
  const [reFetchClientProfile] = useGetClientProfileLazyQuery({
    fetchPolicy: 'network-only',
  });

  const clientProfileId = clientProfile?.id;

  const onSubmit = async (formData: TClientContactFormState) => {
    if (!clientProfileId || isError || !formIsValid) {
      return false;
    }

    try {
      setIsLoading(true);

      const mutationFn = relationId ? updateContact : createContact;

      const response = await mutationFn({
        variables: {
          data: {
            clientProfile: clientProfileId,
            ...formData,
            ...(relationId && { id: relationId }),
          },
        },
        errorPolicy: 'all',
      });

      if (!response) {
        throw new Error('update/create contact mutation response missing.');
      }

      const extensionErrors = extractExtensionErrors(response);

      if (extensionErrors) {
        applyManualFormErrors(extensionErrors, setError);

        return false;
      }

      if (!isSuccessMutationResponse(response)) {
        throw new Error('invalid mutation response');
      }

      await reFetchClientProfile({ variables: { id: clientProfileId } });

      router.replace(
        getViewClientProfileRoute({
          id: clientProfileId,
          openCard: ClientProfileSectionEnum.RelevantContacts,
        })
      );

      return true;
    } catch (e) {
      console.error('Error updating Relevant Contact:', e);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    control,
    errors,
    isSubmitted,
    formIsValid,
    handleSubmit,
    onSubmit,
    isLoading,
    setIsLoading,
    isError,
    setValue,
    clearErrors,
  };
}

function isSuccessMutationResponse(
  response: FetchResult<
    UpdateClientContactMutation | CreateClientContactMutation
  >
): boolean {
  const responseData = response.data;

  if (!responseData) {
    return false;
  }

  const modelTypename = 'ClientContactType';

  if ('updateClientContact' in responseData) {
    const typename = responseData.updateClientContact.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  if ('createClientContact' in responseData) {
    const typename = responseData.createClientContact.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  return false;
}
