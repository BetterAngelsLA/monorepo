import { ApolloClient } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { extractOperationFieldErrors } from '../../../../../apollo';
import { applyOperationFieldErrors } from '../../../../../errors';
import { TShowSnackbar } from '../../../../../providers/snackbar/SnackbarProvider';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { GetClientProfileDocument } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import {
  CreateClientContactDocument,
  CreateClientContactMutation,
  UpdateClientContactDocument,
  UpdateClientContactMutation,
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

  const [createClientContact] = useMutation(CreateClientContactDocument);
  const [updateClientContact] = useMutation(UpdateClientContactDocument);
  const [reFetchClientProfile] = useLazyQuery(GetClientProfileDocument, {
    fetchPolicy: 'network-only',
  });

  const clientProfileId = clientProfile?.id;

  const onSubmit = async (formData: TClientContactFormState) => {
    if (!clientProfileId || isError || !formIsValid) {
      return false;
    }

    try {
      setIsLoading(true);

      const mutationKey = relationId
        ? 'updateClientContact'
        : 'createClientContact';

      const dataPayload = {
        clientProfile: clientProfileId,
        ...formData,
        ...(relationId ? { id: relationId } : {}),
      };

      const response = relationId
        ? await updateClientContact({
            variables: { data: dataPayload },
            errorPolicy: 'all',
          })
        : await createClientContact({
            variables: { data: dataPayload },
            errorPolicy: 'all',
          });

      if (!response) {
        throw new Error(`${mutationKey} response missing.`);
      }

      const fieldErrors = relationId
        ? extractOperationFieldErrors<
            UpdateClientContactMutation,
            'updateClientContact'
          >({
            data: response.data as
              | UpdateClientContactMutation
              | null
              | undefined,
            dataKey: 'updateClientContact',
          })
        : extractOperationFieldErrors<
            CreateClientContactMutation,
            'createClientContact'
          >({
            data: response.data as
              | CreateClientContactMutation
              | null
              | undefined,
            dataKey: 'createClientContact',
          });

      if (fieldErrors.length) {
        applyOperationFieldErrors(fieldErrors, setError);
        return false;
      }

      if (!isSuccessMutationResponse(response)) {
        throw new Error(`invalid ${mutationKey} response.`);
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
  response: ApolloClient.MutateResult<
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
