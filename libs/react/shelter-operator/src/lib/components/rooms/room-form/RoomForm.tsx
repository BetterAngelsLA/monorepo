import { zodResolver } from '@hookform/resolvers/zod';
import { extractOperationInfoMessage, toError } from '@monorepo/react/shared';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  useCreateRoom,
  useFilteredPropertyOptions,
  useUpdateRoom,
} from '../../../hooks';
import { Form } from '../../form/Form';
import { createEmptyRoomFormData } from './constants/defaultRoomFormData';
import { formSchema } from './constants/formSchema';
import type { RoomFormData } from './formTypes';
import { buildCreateRoomInput, buildUpdateRoomInput } from './roomFormInput';
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

  const { createRoom, loading: isCreating } = useCreateRoom();

  const { updateRoom, loading: isUpdating } = useUpdateRoom();

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
        });

        const errorMessage = extractOperationInfoMessage(result, 'updateRoom');
        if (errorMessage) {
          console.error(errorMessage);
          setSubmissionError('Unable to update room. Please try again.');
          return;
        }
      } else {
        const { data: result } = await createRoom({
          variables: {
            data: buildCreateRoomInput(data, shelterId),
          },
        });

        const errorMessage = extractOperationInfoMessage(result, 'createRoom');
        if (errorMessage) {
          console.error(errorMessage);
          setSubmissionError('Unable to create room. Please try again.');
          return;
        }
      }
    } catch (err) {
      const error = toError(err);
      console.error(
        `error ${roomId ? 'updating' : 'creating'} room: ${error.message}`
      );
      setSubmissionError(
        `Unable to ${roomId ? 'update' : 'create'} room. Please try again.`
      );
      return;
    }

    if (!isEditMode) {
      reset();
    }
    onSuccess?.();
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
            className="flex items-start rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <span className="flex-1">{submissionError}</span>
            <button
              onClick={() => setSubmissionError(null)}
              className="ml-3 text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              ×
            </button>
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
