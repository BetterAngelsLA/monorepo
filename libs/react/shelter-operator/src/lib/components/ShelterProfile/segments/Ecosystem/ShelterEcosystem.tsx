import { useState } from 'react';
import {
  useAdminShelterProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterEcosystemForm } from './ShelterEcosystemForm';
import { type EcosystemFormData, toFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: EcosystemFormData
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    cityId: data.city?.id ?? null,
    spaId: data.spa?.id ?? null,
    citiesServedIds: data.citiesServed.map((city) => city.id),
    spasServedIds: data.spasServed.map((spa) => spa.id),
    cityCouncilDistrict: data.cityCouncilDistrict ?? null,
    supervisorialDistrict: data.supervisorialDistrict ?? null,
    shelterPrograms: data.shelterPrograms,
    funders: data.funders,
    fundersOther: data.fundersOther ?? null,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterEcosystem(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useAdminShelterProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
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
