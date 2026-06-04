import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import {
  type UseUpdateShelterInput,
  useUpdateShelter,
} from '../../../../hooks/useUpdateShelter';
import { useToast } from '../../../base-ui/toast';
import { ShelterDetailsForm } from './ShelterDetailsForm';
import { type DetailsFormData, toFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: DetailsFormData
): UseUpdateShelterInput {
  return {
    id: shelterId,
    demographics: data.demographics,
    specialSituationRestrictions: data.specialSituationRestrictions,
    shelterTypes: data.shelterTypes,
    accessibility: data.accessibility,
    storage: data.storage,
    pets: data.pets,
    parking: data.parking,
    addNotesShelterDetails: data.addNotesShelterDetails,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterDetails(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelter(shelterId);
  const { updateShelter } = useUpdateShelter();
  const { showToast } = useToast();

  async function onSubmit(data: DetailsFormData) {
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
    <ShelterDetailsForm
      defaultValues={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
