import type { GraphQLError } from 'graphql';
import type { UseFormSetError } from 'react-hook-form';
import { extractExtensionErrors } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import {
  CreateClientHouseholdMemberMutation,
  UpdateClientHouseholdMemberMutation,
} from './__generated__/householdMember.generated';
import { THouseholdMemberFormState } from './types';

// this matches what your useMutationWithErrors returns
type ExecutedMutationResult<TData> = {
  data?: TData | null;
  errors?: readonly GraphQLError[];
};

// Temp/fake mutation fn type – matches what useMutation gives you
type HouseholdMutationFn<TData> = (
  // accept whatever Apollo's mutate fn accepts
  ...args: any[]
) => Promise<{
  data?: TData | null;
  errors?: readonly GraphQLError[];
}>;

type TProps = {
  formData: THouseholdMemberFormState;
  clientProfileId: string;
  relationId?: string;
  setError: UseFormSetError<THouseholdMemberFormState>;
  createHouseholdMember: HouseholdMutationFn<CreateClientHouseholdMemberMutation>;
  updateHouseholdMember: HouseholdMutationFn<UpdateClientHouseholdMemberMutation>;
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

  let response:
    | ExecutedMutationResult<CreateClientHouseholdMemberMutation>
    | ExecutedMutationResult<UpdateClientHouseholdMemberMutation>;

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
  }

  return next;
}

function isSuccessMutationResponse(
  response:
    | ExecutedMutationResult<CreateClientHouseholdMemberMutation>
    | ExecutedMutationResult<UpdateClientHouseholdMemberMutation>
): boolean {
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
