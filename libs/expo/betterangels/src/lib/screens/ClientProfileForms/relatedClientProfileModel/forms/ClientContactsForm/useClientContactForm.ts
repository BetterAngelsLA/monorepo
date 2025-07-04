import { FetchResult } from '@apollo/client';
import { Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { UseFormSetError, useForm, useWatch } from 'react-hook-form';
import {
  OperationMessage,
  extractExtensionErrors,
  extractOperationInfo,
} from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import { TShowSnackbar } from '../../../../../providers/snackbar/SnackbarProvider';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { useGetClientProfileLazyQuery } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import {
  CreateClientContactMutation,
  UpdateClientContactMutation,
  useCreateClientContactMutation,
  useUpdateClientContactMutation,
} from './__generated__/clientContact.generated';
import { defaultFormState, toFormState } from './toFormState';
import { TClientContactFormState, TFormKey } from './types';

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
    setValue('phoneNumber', phoneNumber?.slice(0, 10));
    setValue('extension', phoneNumber?.slice(11));
    setValue('mailingAddress', mailingAddress);
    setValue('relationshipToClient', relationshipToClient);
  }, [clientProfile, relationId, setValue, toFormState]);

  const [email, phoneNumber, extension, mailingAddress, relationshipToClient] =
    useWatch({
      control,
      name: [
        'email',
        'phoneNumber',
        'extension',
        'mailingAddress',
        'relationshipToClient',
      ],
    });

  const oneOfMissingError = !email && !phoneNumber && !mailingAddress;
  const isError = oneOfMissingError || !relationshipToClient;

  const [createClientContact] = useCreateClientContactMutation();
  const [updateClientContact] = useUpdateClientContactMutation();
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

      const mutationFn = relationId ? updateClientContact : createClientContact;
      const mutationKey = relationId
        ? 'updateClientContact'
        : 'createClientContact';

      delete formData.extension;

      if (phoneNumber && extension) {
        formData['phoneNumber'] = extension
          ? `${phoneNumber}x${extension}`
          : phoneNumber;
      }

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
        throw new Error(`${mutationKey} response missing.`);
      }

      const errorsApplied = applyValidationErrors(
        response,
        mutationKey,
        setError
      );

      if (errorsApplied) {
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

function applyValidationErrors(
  response: FetchResult<
    CreateClientContactMutation | UpdateClientContactMutation
  >,
  key: 'updateClientContact' | 'createClientContact',
  setError: UseFormSetError<TClientContactFormState>
): boolean {
  let hasErrors = false;

  const operationInfo = extractOperationInfo(response, key);
  const operationMessages: OperationMessage[] = operationInfo?.messages || [];

  const formKeys: TFormKey[] = [
    'name',
    'email',
    'phoneNumber',
    'extension',
    'mailingAddress',
    'relationshipToClient',
  ];

  operationMessages.forEach((m) => {
    const err =
      formKeys.includes(m.field as TFormKey) && m.kind === 'VALIDATION';

    if (err) {
      setError(m.field as TFormKey, {
        type: 'manual',
        message: m.message || 'Invalid field.',
      });

      hasErrors = true;
    }
  });

  const extensionErrors = extractExtensionErrors(response);

  if (extensionErrors) {
    applyManualFormErrors(extensionErrors, setError);

    hasErrors = true;
  }

  return hasErrors;
}
