import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useShelterPermissions,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterEntryRequirementsForm } from './ShelterEntryRequirementsForm';
import {
  type EntryRequirementsFormData,
  formFieldNames,
  toFormData,
} from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: EntryRequirementsFormData,
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    entryRequirements: data.entryRequirements,
    referralRequirement: data.referralRequirement,
    vaccinationRequirement: data.vaccinationRequirement,
    bedFees: data.bedFees,
    programFees: data.programFees,
    entryInfo: data.entryInfo,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterEntryRequirements(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();
  const { canEditShelter } = useShelterPermissions();

  async function onSubmit(
    data: EntryRequirementsFormData,
    setError: UseFormSetError<EntryRequirementsFormData>,
  ) {
    try {
      setDisabled(true);

      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data) },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...updateShelterProfileMeta,
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      setEditMode(false);

      showToast({
        status: 'success',
        title: 'Shelter updated.',
      });
    } catch (e) {
      let userMessage = 'An unexpected error occurred.';

      if (e instanceof BaError) {
        userMessage = e.message;
      }

      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: userMessage,
      });
    } finally {
      setDisabled(false);
    }
  }

  function onCancel() {
    setEditMode(false);
  }

  if (!shelter) {
    return null;
  }

  return (
    <ShelterEntryRequirementsForm
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={canEditShelter ? () => setEditMode(true) : undefined}
      onCancel={onCancel}
      disabled={disabled}
    />
  );
}
