import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import {
  useUpdateShelter,
  UseUpdateShelterInput,
} from '../../../../hooks/useUpdateShelter';
import { useToast } from '../../../base-ui/toast';
import { type BasicInfoFormData, toFormData } from './formSchema';
import { ShelterBasicInfoForm } from './ShelterBasicInfoForm';

function toUpdateInput(
  shelterId: string,
  data: BasicInfoFormData
): UseUpdateShelterInput {
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

  const { shelter } = useShelter(shelterId);
  const { updateShelter } = useUpdateShelter();
  const { showToast } = useToast();

  async function onSubmit(data: BasicInfoFormData) {
    try {
      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data) },
      });

      const result = response.data?.updateShelter;

      // success
      if (result?.__typename === 'ShelterType') {
        setEditMode(false);

        showToast({
          status: 'success',
          title: 'Shelter updated.',
        });

        return;
      }

      // error
      // TODO: handle specific OperationInfo field errors via SDB-241

      throw new Error('unexpected query error');
    } catch (e) {
      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
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
