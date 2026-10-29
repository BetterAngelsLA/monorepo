import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useBaPrivatePermissions,
  useShelterOperatorProfile,
  useShelterPermissions,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../../hooks';
import { useToast } from '../../../../base-ui/toast';
import { ShelterReviewForm } from './ShelterReviewForm';
import { formFieldNames, toFormData, type ReviewFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: ReviewFormData,
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    overallRating: data.overallRating,
    declinedBaVisit: data.declinedBaVisit,
    subjectiveReview: data.subjectiveReview || null,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterReview(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();
  const { canEditShelter } = useShelterPermissions();
  const { baReviewPermissions } = useBaPrivatePermissions();

  async function onSubmit(
    data: ReviewFormData,
    setError: UseFormSetError<ReviewFormData>,
  ) {
    try {
      setDisabled(true);

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
    } finally {
      setDisabled(false);
    }
  }

  function onCancel() {
    setEditMode(false);
  }

  if (!shelter || !baReviewPermissions.canView) {
    return null;
  }

  const canEditReview = canEditShelter && baReviewPermissions.canEdit;

  return (
    <ShelterReviewForm
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={canEditReview ? () => setEditMode(true) : undefined}
      onCancel={onCancel}
      disabled={disabled}
    />
  );
}
