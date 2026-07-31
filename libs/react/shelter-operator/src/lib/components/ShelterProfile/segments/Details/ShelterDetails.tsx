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
import { ShelterDetailsForm } from './ShelterDetailsForm';
import { type DetailsFormData, formFieldNames, toFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: DetailsFormData
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    demographics: data.demographics,
    demographicsOther: data.demographicsOther,
    specialSituationRestrictions: data.specialSituationRestrictions,
    shelterTypes: data.shelterTypes,
    shelterTypesOther: data.shelterTypesOther,
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
  const [formKey, setFormKey] = useState(0);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(
    data: DetailsFormData,
    setError: UseFormSetError<DetailsFormData>
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
    <ShelterDetailsForm
      key={formKey}
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
