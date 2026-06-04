import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import { useUpdateShelter } from '../../../../hooks/useUpdateShelter';
import { useToast } from '../../../base-ui/toast';
import { ShelterBasicInfoForm } from './ShelterBasicInfoForm';
import { type BasicInfoFormData, toFormData } from './formSchema';

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
        variables: {
          data: {
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
          },
        },
      });

      const result = response.data?.updateShelter;

      // success
      if (result?.__typename === 'ShelterType') {
        setEditMode(false);

        return;
      }

      // type OperationInfo {
      //   """List of messages returned by the operation."""
      //   messages: [OperationMessage!]!
      // }

      // type OperationMessage {
      //   """The kind of this message."""
      //   kind: OperationMessageKind!

      //   """The error message."""
      //   message: String!

      //   """
      //   The field that caused the error, or `null` if it isn't associated with any particular field.
      //   """
      //   field: String

      //   """The error code, or `null` if no error code was set."""
      //   code: String
      // }

      // error
      if (result?.__typename === 'OperationInfo') {
        const message = result.messages?.[0]?.message ?? 'An error occurred';
        console.error('[updateShelter OperationInfo]:', message);

        showToast({
          status: 'error',
          title: 'Failed to update shelter',
          description: message,
        });

        return;
      }
    } catch (e) {
      console.error(`[updateShelter error]: ${e}`);

      showToast({
        status: 'error',
        title: 'Failed to update shelter',
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
