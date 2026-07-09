import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import {
  type BasicInfoFormData,
  formFieldNames,
  toFormData,
} from './formSchema';
import { ShelterBasicInfoForm } from './ShelterBasicInfoForm';

function toUpdateInput(
  shelterId: string,
  data: BasicInfoFormData
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    name: data.name,
    status: data.status,
    description: data.description,
    email: data.email || null,
    phone: data.phone || null,
    website: data.website || null,
    isPrivate: data.isPrivate,
    location: data.location
      ? {
          place: data.location.place,
          latitude: data.location.latitude ?? null,
          longitude: data.location.longitude ?? null,
        }
      : null,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterBasicInfo(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(
    data: BasicInfoFormData,
    setError: UseFormSetError<BasicInfoFormData>
  ) {
    try {
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
    }
  }

  function onCancel() {
    setEditMode(false);
  }

  if (!shelter) {
    return null;
  }

  return (
    <ShelterBasicInfoForm
      defaultValues={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
