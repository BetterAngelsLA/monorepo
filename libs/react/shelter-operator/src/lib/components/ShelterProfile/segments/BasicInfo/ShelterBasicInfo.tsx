import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { useState } from 'react';
import {
  OPERATION_KEY,
  PAYLOAD_TYPENAME,
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { type BasicInfoFormData, formSchema, toFormData } from './formSchema';
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
    // website: data.website || null,
    website: 'hello',
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

  async function onSubmit(data: BasicInfoFormData) {
    try {
      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data) },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        operationKey: OPERATION_KEY,
        successTypename: PAYLOAD_TYPENAME,
        fields: Object.keys(formSchema.shape),
      });

      console.log();
      console.log('| -------------  fieldErrors  ------------- |');
      console.log(fieldErrors);
      console.log();

      if (fieldErrors.length) {
        // TODO: applyFieldErrors(fieldErrors, setError) — once libs/ts is ready
        console.error('[updateShelter field errors]:', fieldErrors);
        return;
      }

      setEditMode(false);

      showToast({
        status: 'success',
        title: 'Shelter updated.',
      });
    } catch (e) {
      if (e instanceof BaError) {
        console.error(`[updateShelter error]: ${e.message}`);

        showToast({
          status: 'error',
          title: 'Update failed',
          description: e.message,
        });
      } else {
        console.error(`[updateShelter error]: ${e}.`);

        showToast({
          status: 'error',
          title: 'Update failed',
          description: 'An unexpected error occurred.',
        });
      }
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
