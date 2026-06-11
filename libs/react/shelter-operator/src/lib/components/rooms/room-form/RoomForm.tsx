import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@monorepo/react/components';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { GetRoomsDocument } from '../api/__generated__/roomQueries.generated';
import {
  CREATE_ROOM_MUTATION,
  buildCreateRoomInput,
  type CreateRoomMutationResult,
  type CreateRoomMutationVariables,
} from '../api/createRoomMutation';
import {
  UPDATE_ROOM_MUTATION,
  buildUpdateRoomInput,
  type UpdateRoomMutationResult,
  type UpdateRoomMutationVariables,
} from '../api/updateRoomMutation';
import { createEmptyRoomFormData } from './constants/defaultRoomFormData';
import { formSchema } from './constants/validation';
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
    CreateRoomMutationResult,
    CreateRoomMutationVariables
  >(CREATE_ROOM_MUTATION, { refetchQueries });

  const [updateRoom, { loading: isUpdating }] = useMutation<
    UpdateRoomMutationResult,
    UpdateRoomMutationVariables
  >(UPDATE_ROOM_MUTATION, { refetchQueries });

  const isSubmitting = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (data: RoomFormData) => {
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
      }

      if (!isEditMode) {
        reset();
      }
      onSuccess?.();
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        {submissionError ? (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {submissionError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-6" data-testid="room-form">
          <BasicInformationSection control={control} errors={errors} />
          <RoomDetailsSection control={control} errors={errors} />

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
              disabled={isSubmitting || !isValid}
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
    </FormProvider>
  );
}
