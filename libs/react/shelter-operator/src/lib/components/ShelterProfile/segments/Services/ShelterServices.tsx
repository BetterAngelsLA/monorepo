import { useApolloClient } from '@apollo/client/react';
import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterServicesForm } from './ShelterServicesForm';
import {
  type ServicesFormData,
  formFieldNames,
  toFormData,
} from './formSchema';

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
  const [formKey, setFormKey] = useState(0);

  const client = useApolloClient();
  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(
    data: ServicesFormData,
    setError: UseFormSetError<ServicesFormData>
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

      // Refetch service categories in the background so the "Other"
      // dropdown picks up newly-created services on the next edit.
      client.refetchQueries({
        include: [ShelterServiceCategoriesDocument],
      });

      setEditMode(false);
      setFormKey((k) => k + 1);

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
    <ShelterServicesForm
      key={formKey}
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
