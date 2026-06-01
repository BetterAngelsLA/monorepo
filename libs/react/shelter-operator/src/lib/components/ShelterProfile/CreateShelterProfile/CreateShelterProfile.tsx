import { useMutation } from '@apollo/client/react';
import {
  CreateShelterDocument,
  type CreateShelterInput,
  type CreateShelterMutation,
  type CreateShelterMutationVariables,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveOrg } from '../../../providers/activeOrg';
import {
  shelterProfileRoute,
  shelterProfileSegments,
} from '../../../routing/routePaths';
import { useToast } from '../../base-ui/toast/state/useToast';
import { BasicInfoForm, type BasicInfoFormData } from '../BasicInfo';

function toCreateInput(
  formData: BasicInfoFormData,
  organizationId: string
): CreateShelterInput {
  return {
    name: formData.name,
    description: formData.description || '',
    location: formData.location ?? undefined,
    email: formData.email?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    website: formData.website?.trim() || undefined,
    isPrivate: formData.isPrivate,
    status: formData.status, // TODO: enable query to return DRAFT shelters etc via permissions
    organization: organizationId,
    // Required arrays - empty for initial creation (TODO: remove requirement via SDB-209)
    accessibility: [],
    demographics: [],
    specialSituationRestrictions: [],
    shelterTypes: [],
    roomStyles: [],
    storage: [],
    pets: [],
    parking: [],
    entryRequirements: [],
    referralRequirement: [],
    vaccinationRequirement: [],
    exitPolicy: [],
    shelterPrograms: [],
    funders: [],
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

  async function handleSubmit(formData: BasicInfoFormData) {
    if (!activeOrg?.id) {
      return;
    }

    setDisabled(true);

    const data = toCreateInput(formData, activeOrg.id);

    try {
      const response = await createShelter({ variables: { data } });
      const result = response.data?.createShelter;

      if (result?.__typename === 'ShelterType') {
        showToast({
          status: 'success',
          title: 'Shelter created!',
        });

        navigate(shelterProfileRoute(result.id, shelterProfileSegments.basic));

        return;
      }

      // error state
      // TODO: wire up OperationInfo field messages
      //   if (result?.__typename === 'OperationInfo') {
      //     const message = result.messages?.[0]?.message ?? 'An error occurred';
      //     console.error('Create shelter error:', message);
      //     return;
      //   }

      console.error(result);

      showToast({
        status: 'error',
        title: 'Failed to create shelter',
        description: 'An unexpected error occurred.',
      });
    } catch (err) {
      console.error('Create shelter error:', err);

      showToast({
        status: 'error',
        title: 'Sorry, Failed to create shelter',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <BasicInfoForm
      onSubmit={handleSubmit}
      disabled={disabled}
      className={className}
    />
  );
}
