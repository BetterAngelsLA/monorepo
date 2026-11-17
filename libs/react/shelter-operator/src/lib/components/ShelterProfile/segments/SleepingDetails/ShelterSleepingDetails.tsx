import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { RoomStyleChoices } from '@monorepo/react/shelter';
import { useMemo, useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useShelterPermissions,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { Text } from '../../../base-ui/text/text';
import { useToast } from '../../../base-ui/toast';
import { ShelterSleepingDetailsForm } from './ShelterSleepingDetailsForm';
import {
  AVAILABILITY_INPUT,
  type SleepingDetailsFormData,
  formFieldNames,
  toAvailabilityPayload,
  toFormData,
  toFormFieldErrors,
} from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: SleepingDetailsFormData,
  stored: SleepingDetailsFormData,
): UseUpdateShelterProfileInput {
  const availability = toAvailabilityPayload(data, stored);

  return {
    id: shelterId,
    totalBeds: data.totalBeds ?? null,
    // Only the fields that changed: the API applies `availability` as a
    // partial update, and an untouched counter must not be rewritten with the
    // value this form loaded.
    ...(availability ? { availability } : {}),
    roomStyles: data.roomStyles,
    roomStylesOther: data.roomStyles.includes(RoomStyleChoices.Other)
      ? (data.roomStylesOther ?? null)
      : null,
    addNotesSleepingDetails: data.addNotesSleepingDetails || null,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterSleepingDetails(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);

  const { shelter, error } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();
  const { canEditShelter } = useShelterPermissions();

  // Computed once per loaded profile and used for both the form's initial
  // values and the "did this field change?" diff, so the two cannot drift.
  const stored = useMemo(
    () => (shelter ? toFormData(shelter) : null),
    [shelter],
  );

  async function onSubmit(
    data: SleepingDetailsFormData,
    setError: UseFormSetError<SleepingDetailsFormData>,
  ) {
    if (!stored) {
      return;
    }

    try {
      setDisabled(true);

      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data, stored) },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...updateShelterProfileMeta,
        // Availability is a nested input, so its messages arrive under
        // `availability.<field>`; allow the parent path and re-point them below.
        fields: [...formFieldNames, AVAILABILITY_INPUT],
      });

      if (fieldErrors.length) {
        applyFieldErrors(toFormFieldErrors(fieldErrors), setError);

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

  // A failed profile query used to render an empty tab, which reads as "this
  // shelter has no sleeping details" rather than "this did not load".
  if (error) {
    return (
      <Text variant="body" className="px-6 py-4">
        We couldn&rsquo;t load this shelter&rsquo;s sleeping details. Refresh the
        page to try again.
      </Text>
    );
  }

  if (!shelter || !stored) {
    return null;
  }

  return (
    <ShelterSleepingDetailsForm
      values={stored}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={canEditShelter ? () => setEditMode(true) : undefined}
      onCancel={onCancel}
      disabled={disabled}
    />
  );
}
