import { useState } from 'react';
import {
  useAdminShelterProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterServicesForm } from './ShelterServicesForm';
import { type ServicesFormData, toFormData } from './formSchema';

/**
 * Converts a service ID to a `ServiceInput` object.
 * Custom "other" services use the format `custom:{categoryId}:{encodedDisplayName}`
 * and are mapped to `{ categoryId, displayName }`. Regular services are mapped to `{ id }`.
 */
function toUpdateInput(
  shelterId: string,
  data: ServicesFormData
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    services: data.services.map(toServiceInput),
  };
}

function toServiceInput(serviceId: string) {
  if (serviceId.startsWith('custom:')) {
    const firstColon = serviceId.indexOf(':');
    const secondColon = serviceId.indexOf(':', firstColon + 1);
    const categoryId = serviceId.slice(firstColon + 1, secondColon);
    const displayName = decodeURIComponent(serviceId.slice(secondColon + 1));

    return { categoryId, displayName };
  }

  return { id: serviceId };
}

type TProps = {
  shelterId: string;
};

export function ShelterServices(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useAdminShelterProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(data: ServicesFormData) {
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
    <ShelterServicesForm
      defaultValues={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
