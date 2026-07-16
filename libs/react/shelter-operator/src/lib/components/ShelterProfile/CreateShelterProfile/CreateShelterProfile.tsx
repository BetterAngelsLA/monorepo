import { useMutation } from '@apollo/client/react';
import {
  BaError,
  getFieldErrorsOrThrow,
  useActiveOrg,
} from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import {
  CreateShelterDocument,
  type CreateShelterInput,
  type CreateShelterMutation,
  type CreateShelterMutationVariables,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  shelterProfileRoute,
  shelterProfileSegments,
} from '../../../routing/routePaths';
import { useToast } from '../../base-ui/toast/state/useToast';
import {
  formFieldNames,
  ShelterBasicInfoForm,
  type BasicInfoFormData,
} from '../segments/BasicInfo';

function toCreateInput(formData: BasicInfoFormData): CreateShelterInput {
  return {
    name: formData.name,
    description: formData.description || '',
    location: formData.location ?? undefined,
    email: formData.email || undefined,
    phone: formData.phone || undefined,
    website: formData.website || undefined,
    isPrivate: formData.isPrivate,
    status: formData.status,
  };
}

type TProps = {
  className?: string;
};

export function CreateShelterProfile(props: TProps) {
  const { className } = props;

  const { activeOrg } = useActiveOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);

  const [createShelter] = useMutation<
    CreateShelterMutation,
    CreateShelterMutationVariables
  >(CreateShelterDocument);

  async function handleSubmit(
    formData: BasicInfoFormData,
    setError: UseFormSetError<BasicInfoFormData>,
  ) {
    if (!activeOrg?.id) {
      return;
    }

    setDisabled(true);

    const data = toCreateInput(formData);

    try {
      const response = await createShelter({ variables: { data } });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        operationKey: 'createShelter',
        successTypename: 'ShelterType',
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      const result = response.data?.createShelter;

      if (result?.__typename !== 'ShelterType') {
        throw new Error('Failed to create shelter');
      }

      showToast({
        status: 'success',
        title: 'Shelter created!',
      });

      navigate(shelterProfileRoute(result.id, shelterProfileSegments.basic));
    } catch (err) {
      let userMessage = 'An unexpected error occurred.';

      if (err instanceof BaError) {
        userMessage = err.message;
      }

      console.error('Create shelter error:', err);

      showToast({
        status: 'error',
        title: 'Sorry, Failed to create shelter',
        description: userMessage,
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <ShelterBasicInfoForm
      onSubmit={handleSubmit}
      disabled={disabled}
      className={className}
    />
  );
}
