import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import {
  UseUpdateShelterInput,
  useUpdateShelter,
} from '../../../../hooks/useUpdateShelter';
import { useToast } from '../../../base-ui/toast';
import { ShelterEcosystemForm } from './ShelterEcosystemForm';
import { type EcosystemFormData, toFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: EcosystemFormData
): UseUpdateShelterInput {
  return {
    id: shelterId,
    cityId: data.city?.id ?? null,
    spaId: data.spa?.id ?? null,
    shelterPrograms: data.shelterPrograms,
    funders: data.funders,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterEcosystem(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelter(shelterId);
  const { updateShelter } = useUpdateShelter();
  const { showToast } = useToast();

  async function onSubmit(data: EcosystemFormData) {
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
    <ShelterEcosystemForm
      defaultValues={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
