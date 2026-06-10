import { useMutation } from '@apollo/client/react';
import { Button } from '@monorepo/react/components';
import { useCallback, useMemo, useState, type SubmitEvent } from 'react';
import { GetShelterRoomsDocument } from '../__generated__/rooms.generated';
import {
  CREATE_ROOM_MUTATION,
  buildCreateRoomInput,
  type CreateRoomMutationResult,
  type CreateRoomMutationVariables,
} from './api/createRoomMutation';
import {
  UPDATE_ROOM_MUTATION,
  buildUpdateRoomInput,
  type UpdateRoomMutationResult,
  type UpdateRoomMutationVariables,
} from './api/updateRoomMutation';
import {
  validateField,
  validateRoomForm,
  type FormErrors,
} from './constants/validation';
import type { RoomFormData } from './formTypes';
import { useRoomForm } from './hooks/useRoomForm';
import { BasicInformationSection } from './sections/BasicInformationSection';
import { RoomDetailsSection } from './sections/RoomDetailsSection';

export type RoomFormProps = {
  shelterId: string;
  roomId?: string;
  initialData?: RoomFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function RoomForm({
  shelterId,
  roomId,
  initialData,
  onSuccess,
  onCancel,
}: RoomFormProps) {
  const isEditMode = Boolean(roomId);
  const { formData, updateField, resetForm } = useRoomForm(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const refetchQueries = useMemo(
    () => [{ query: GetShelterRoomsDocument, variables: { shelterId } }],
    [shelterId]
  );

  const [createRoom, { loading: isCreating }] = useMutation<
    CreateRoomMutationResult,
    CreateRoomMutationVariables
  >(CREATE_ROOM_MUTATION, { refetchQueries });

  const [updateRoom, { loading: isUpdating }] = useMutation<
    UpdateRoomMutationResult,
    UpdateRoomMutationVariables
  >(UPDATE_ROOM_MUTATION, { refetchQueries });

  const isSubmitting = isCreating || isUpdating;

  const handleFieldChange = useCallback(
    <K extends keyof RoomFormData>(field: K, value: RoomFormData[K]) => {
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

    const validation = validateRoomForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    try {
      if (isEditMode && roomId) {
        const { data } = await updateRoom({
          variables: {
            id: roomId,
            data: buildUpdateRoomInput(formData),
          },
          errorPolicy: 'all',
        });

        const result = data?.updateRoom;

        if (result?.__typename === 'OperationInfo') {
          const firstMessage = result.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to update room. Please try again.'
          );
          return;
        }
      } else {
        const { data } = await createRoom({
          variables: {
            data: buildCreateRoomInput(formData, shelterId),
          },
          errorPolicy: 'all',
        });

        const result = data?.createRoom;

        if (result?.__typename === 'OperationInfo') {
          const firstMessage = result.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to create room. Please try again.'
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
        data-testid="room-form"
      >
        <BasicInformationSection {...sectionProps} />
        <RoomDetailsSection {...sectionProps} />

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
              ? 'Save Room'
              : 'Create Room'}
          </Button>
        </div>
      </form>
    </div>
  );
}
