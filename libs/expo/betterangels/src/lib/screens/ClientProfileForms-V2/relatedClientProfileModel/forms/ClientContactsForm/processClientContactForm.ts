import { FetchResult } from '@apollo/client';
import { UseFormClearErrors, UseFormSetError } from 'react-hook-form';
import { extractExtensionErrors } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import {
  CreateClientContactMutation,
  CreateClientContactMutationFn,
  UpdateClientContactMutation,
  UpdateClientContactMutationFn,
} from './__generated__/clientContact.generated';
import { TClientContactFormState } from './types';

type TProps = {
  formData: TClientContactFormState;
  clientProfileId: string;
  relationId: string | undefined;
  setError: UseFormSetError<TClientContactFormState>;
  clearErrors: UseFormClearErrors<TClientContactFormState>;
  createMutation: CreateClientContactMutationFn;
  updateMutation: UpdateClientContactMutationFn;
};

export async function processClientContactForm(
  props: TProps
): Promise<boolean> {
  const {
    formData,
    clientProfileId,
    relationId,
    setError,
    createMutation,
    updateMutation,
  } = props;
  if (!formData) {
    return false;
  }

  const mutationFn = relationId ? updateMutation : createMutation;

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

  const extensionErrors = extractExtensionErrors(response);

  if (extensionErrors) {
    applyManualFormErrors(extensionErrors, setError);

    return false;
  }

  if (!isSuccessMutationResponse(response)) {
    throw new Error('invalid mutation response');
  }

  return true;
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
