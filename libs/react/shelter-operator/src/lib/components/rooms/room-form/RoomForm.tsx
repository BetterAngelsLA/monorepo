import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isMutationSuccess } from '@monorepo/react/shared';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useFilteredPropertyOptions } from '../../../hooks/useFilteredPropertyOptions';
import { Form } from '../../form/Form';
import { GetRoomsDocument } from '../api/__generated__/roomQueries.generated';
import {
  CreateRoomDocument,
  buildCreateRoomInput,
  type CreateRoomMutation,
  type CreateRoomMutationVariables,
} from '../api/createRoomMutation';
import {
  UpdateRoomDocument,
  buildUpdateRoomInput,
  type UpdateRoomMutation,
  type UpdateRoomMutationVariables,
} from '../api/updateRoomMutation';
import { createEmptyRoomFormData } from './constants/defaultRoomFormData';
import { formSchema } from './constants/formSchema';
import type { RoomFormData } from './formTypes';
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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? createEmptyRoomFormData(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = methods;

  const refetchQueries = useMemo(
    () => [{ query: GetRoomsDocument, variables: { shelterId } }],
    [shelterId]
  );

  const [createRoom, { loading: isCreating }] = useMutation<
    CreateRoomMutation,
    CreateRoomMutationVariables
  >(CreateRoomDocument, { refetchQueries });

  const [updateRoom, { loading: isUpdating }] = useMutation<
    UpdateRoomMutation,
    UpdateRoomMutationVariables
  >(UpdateRoomDocument, { refetchQueries });

  const isSubmitting = isCreating || isUpdating;

  const filteredPropertyOptions = useFilteredPropertyOptions(shelterId);

  async function submitRoom(data: RoomFormData) {
    setSubmissionError(null);

    try {
      if (isEditMode && roomId) {
        const { data: result } = await updateRoom({
          variables: {
            id: roomId,
            data: buildUpdateRoomInput(data),
          },
          errorPolicy: 'all',
        });

        if (result?.updateRoom?.__typename === 'OperationInfo') {
          const firstMessage = result.updateRoom.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to update room. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.updateRoom, 'RoomType')) {
          setSubmissionError('An unexpected error occurred. Please try again.');
          return;
        }
      } else {
        const { data: result } = await createRoom({
          variables: {
            data: buildCreateRoomInput(data, shelterId),
          },
          errorPolicy: 'all',
        });

        if (result?.createRoom?.__typename === 'OperationInfo') {
          const firstMessage = result.createRoom.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to create room. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.createRoom, 'RoomType')) {
          setSubmissionError('An unexpected error occurred. Please try again.');
          return;
        }
      }

      if (!isEditMode) {
        reset();
      }
      onSuccess?.();
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
    }
  }

  function handleCancel() {
    reset();
    onCancel?.();
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-4 pb-48">
        {submissionError && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {submissionError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(submitRoom)}
          className="space-y-6"
          data-testid="room-form"
        >
          <BasicInformationSection control={control} errors={errors} />
          <RoomDetailsSection
            control={control}
            errors={errors}
            filteredPropertyOptions={filteredPropertyOptions}
          />

          <Form.Actions
            onPrimaryClick={() => handleSubmit(submitRoom)()}
            onSecondaryClick={onCancel ? handleCancel : undefined}
            primaryDisabled={isSubmitting || !isValid}
            secondaryDisabled={isSubmitting}
            primaryLabel={
              isSubmitting
                ? 'Submitting…'
                : isEditMode
                ? 'Save Room'
                : 'Create Room'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
