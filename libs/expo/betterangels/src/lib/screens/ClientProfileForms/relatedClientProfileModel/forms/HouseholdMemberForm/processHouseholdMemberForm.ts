import { ApolloLink } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import type { UseFormSetError } from 'react-hook-form';
import { extractResponseExtensions } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import {
  CreateClientHouseholdMemberMutation,
  CreateClientHouseholdMemberMutationVariables,
  UpdateClientHouseholdMemberMutation,
  UpdateClientHouseholdMemberMutationVariables,
} from './__generated__/householdMember.generated';
import { THouseholdMemberFormState } from './types';

type HouseholdMutationResult =
  | ApolloLink.Result<CreateClientHouseholdMemberMutation>
  | ApolloLink.Result<UpdateClientHouseholdMemberMutation>;

type TProps = {
  formData: THouseholdMemberFormState;
  clientProfileId: string;
  relationId?: string;
  setError: UseFormSetError<THouseholdMemberFormState>;
  createHouseholdMember: useMutation.MutationFunction<
    CreateClientHouseholdMemberMutation,
    CreateClientHouseholdMemberMutationVariables
  >;
  updateHouseholdMember: useMutation.MutationFunction<
    UpdateClientHouseholdMemberMutation,
    UpdateClientHouseholdMemberMutationVariables
  >;
};

export async function processHouseholdMemberForm(
  props: TProps
): Promise<boolean> {
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
    return false;
  }

  let response: HouseholdMutationResult;

  if (relationId) {
    // UPDATE
    response = await updateHouseholdMember({
      variables: {
        data: {
          id: relationId,
          clientProfile: clientProfileId,
          ...apiInputs,
        },
      },
      errorPolicy: 'all',
    });
  } else {
    // CREATE
    response = await createHouseholdMember({
      variables: {
        data: {
          clientProfile: clientProfileId,
          ...apiInputs,
        },
      },
      errorPolicy: 'all',
    });
  }

  // same error handling as before
  const responseExtensions = extractResponseExtensions(response);

  if (responseExtensions) {
    applyManualFormErrors(responseExtensions, setError);

    return false;
  }

  if (!isSuccessMutationResponse(response)) {
    throw new Error('invalid mutation response');
  }

  return true;
}

function toApiInputs(values: THouseholdMemberFormState) {
  const { name, gender, dateOfBirth, relationshipToClient } = values || {};

  if (!name && !gender && !dateOfBirth && !relationshipToClient) {
    return null;
  }

  // make a copy so we don't mutate RHF's form state
  const next: THouseholdMemberFormState = { ...values };

  if (next.dateOfBirth instanceof Date) {
    next.dateOfBirth = next.dateOfBirth
      .toISOString()
      .split('T')[0] as unknown as Date;
  } else if (next.dateOfBirth === null) {
    next.dateOfBirth = null;
  } else if (next.dateOfBirth === undefined) {
    delete next.dateOfBirth;
  }

  return next;
}

function isSuccessMutationResponse(response: HouseholdMutationResult): boolean {
  const data = response.data;

  if (!data) {
    return false;
  }

  const modelTypename = 'ClientHouseholdMemberType';

  if ('createClientHouseholdMember' in data) {
    return data.createClientHouseholdMember?.__typename === modelTypename;
  }

  if ('updateClientHouseholdMember' in data) {
    return data.updateClientHouseholdMember?.__typename === modelTypename;
  }

  return false;
}
