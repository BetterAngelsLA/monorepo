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
import { ShelterEcosystemForm } from './ShelterEcosystemForm';
import {
  type EcosystemFormData,
  formFieldNames,
  toFormData,
} from './formSchema';

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

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(
    data: EcosystemFormData,
    setError: UseFormSetError<EcosystemFormData>
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
    <ShelterEcosystemForm
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
