import { useMutation, useQuery } from '@apollo/client/react';
import { Button } from '@monorepo/react/components';
import { useCallback, useMemo, useState, type SubmitEvent } from 'react';
import {
  GetShelterRoomsDocument,
  type GetShelterRoomsQuery,
  type GetShelterRoomsQueryVariables,
} from '../../rooms/__generated__/rooms.generated';
import { GetShelterBedsDocument } from '../__generated__/beds.generated';
import {
  CREATE_BED_MUTATION,
  buildCreateBedInput,
  type CreateBedMutationResult,
  type CreateBedMutationVariables,
} from './api/createBedMutation';
import {
  UPDATE_BED_MUTATION,
  buildUpdateBedInput,
  type UpdateBedMutationResult,
  type UpdateBedMutationVariables,
} from './api/updateBedMutation';
import {
  validateBedForm,
  validateField,
  type FormErrors,
} from './constants/validation';
import type { BedFormData } from './formTypes';
import { useBedForm } from './hooks/useBedForm';
import { BasicInformationSection } from './sections/BasicInformationSection';
import { BedDetailsSection } from './sections/BedDetailsSection';

export type BedFormProps = {
  shelterId: string;
  bedId?: string;
  initialData?: BedFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function BedForm({
  shelterId,
  bedId,
  initialData,
  onSuccess,
  onCancel,
}: BedFormProps) {
  const isEditMode = Boolean(bedId);
  const { formData, updateField, resetForm } = useBedForm(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: roomsData } = useQuery<
    GetShelterRoomsQuery,
    GetShelterRoomsQueryVariables
  >(GetShelterRoomsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const roomOptions = useMemo(
    () =>
      (roomsData?.rooms.results ?? []).map((room) => ({
        value: room.id,
        label: room.name,
      })),
    [roomsData?.rooms.results]
  );

  const refetchQueries = useMemo(
    () => [{ query: GetShelterBedsDocument, variables: { shelterId } }],
    [shelterId]
  );

  const [createBed, { loading: isCreating }] = useMutation<
    CreateBedMutationResult,
    CreateBedMutationVariables
  >(CREATE_BED_MUTATION, { refetchQueries });

  const [updateBed, { loading: isUpdating }] = useMutation<
    UpdateBedMutationResult,
    UpdateBedMutationVariables
  >(UPDATE_BED_MUTATION, { refetchQueries });

  const isSubmitting = isCreating || isUpdating;

  const handleFieldChange = useCallback(
    <K extends keyof BedFormData>(field: K, value: BedFormData[K]) => {
      updateField(field, value);
      const fieldError = validateField(field, value);
      setErrors((prev) => {
        if (fieldError) {
          return { ...prev, [field]: fieldError };
        }
        if (prev[field]) {
          const { [field]: _omit, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    },
    [updateField]
  );

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError(null);

    const validation = validateBedForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    try {
      if (isEditMode && bedId) {
        const { data } = await updateBed({
          variables: {
            id: bedId,
            data: buildUpdateBedInput(formData),
          },
          errorPolicy: 'all',
        });

        const result = data?.updateBed;

        if (result?.__typename === 'OperationInfo') {
          const firstMessage = result.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to update bed. Please try again.'
          );
          return;
        }
      } else {
        const { data } = await createBed({
          variables: {
            data: buildCreateBedInput(formData, shelterId),
          },
          errorPolicy: 'all',
        });

        const result = data?.createBed;

        if (result?.__typename === 'OperationInfo') {
          const firstMessage = result.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to create bed. Please try again.'
          );
          return;
        }
      }

      if (!isEditMode) {
        resetForm();
      }
      setErrors({});
      onSuccess?.();
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
    }
  };

  const sectionProps = {
    data: formData,
    onChange: handleFieldChange,
    errors,
    roomOptions,
  };

  return (
    <div className="space-y-4">
      {submissionError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submissionError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-testid="bed-form"
      >
        <BasicInformationSection {...sectionProps} />
        <BedDetailsSection {...sectionProps} />

        <div className="flex justify-end gap-3 pt-2">
          {onCancel ? (
            <Button
              type="button"
              size="xl"
              className="h-auto! px-6 py-3"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            size="xl"
            type="submit"
            className="h-auto! bg-green-600! text-black! px-6 py-3 hover:bg-green-700! transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Submitting…'
              : isEditMode
              ? 'Save Bed'
              : 'Create Bed'}
          </Button>
        </div>
      </form>
    </div>
  );
}
