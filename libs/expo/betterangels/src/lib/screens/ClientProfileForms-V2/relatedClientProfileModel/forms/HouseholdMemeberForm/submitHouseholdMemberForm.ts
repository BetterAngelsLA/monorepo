import { UseFormSetError } from 'react-hook-form';
import { extractExtensionErrors } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import {
  CreateClientHouseholdMemberMutation,
  CreateClientHouseholdMemberMutationFn,
  UpdateClientHouseholdMemberMutation,
  UpdateClientHouseholdMemberMutationFn,
} from './__generated__/householdMember.generated';
import { THouseholdMemberFormState } from './types';

type TProps = {
  formData: THouseholdMemberFormState;
  clientProfileId: string;
  relationId: string | undefined;
  setError: UseFormSetError<THouseholdMemberFormState>;
  createHouseholdMember: CreateClientHouseholdMemberMutationFn;
  updateHouseholdMember: UpdateClientHouseholdMemberMutationFn;
};

export async function submitHouseholdMemberForm(props: TProps) {
  const {
    formData,
    clientProfileId,
    relationId,
    setError,
    createHouseholdMember,
    updateHouseholdMember,
  } = props;
  const apiInputs = toApiInputs(formData);

  if (!apiInputs) {
    return;
  }

  const mutationFn = relationId ? updateHouseholdMember : createHouseholdMember;

  const response = await mutationFn({
    variables: {
      data: {
        clientProfile: clientProfileId,
        ...apiInputs,
        ...(relationId && { id: relationId }),
      },
    },
    errorPolicy: 'all',
  });

  const extensionErrors = extractExtensionErrors(response);

  if (extensionErrors) {
    applyManualFormErrors(extensionErrors, setError);

    return;
  }

  const responseData = response.data;

  if (!responseData) {
    throw new Error('Missing Household member mutation response data');
  }

  if (!isSuccessMutationResponse(responseData)) {
    throw new Error('invalid response');
  }

  return;
}

function toApiInputs(values: THouseholdMemberFormState) {
  const { name, gender, dateOfBirth, relationshipToClient } = values || {};

  if (!name && !gender && !dateOfBirth && !relationshipToClient) {
    return null;
  }

  // convert dateOfBirth to date string and remove time
  if ('dateOfBirth' in values && values.dateOfBirth) {
    values.dateOfBirth = values.dateOfBirth
      .toISOString()
      .split('T')[0] as unknown as Date;
  }

  return values;
}

function isSuccessMutationResponse(
  responseData:
    | UpdateClientHouseholdMemberMutation
    | CreateClientHouseholdMemberMutation
): boolean {
  const modelTypename = 'ClientHouseholdMemberType';

  if ('updateClientHouseholdMember' in responseData) {
    const typename = responseData.updateClientHouseholdMember.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  if ('createClientHouseholdMember' in responseData) {
    const typename = responseData.createClientHouseholdMember.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  return false;
}
