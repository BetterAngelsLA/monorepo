import { zodResolver } from '@hookform/resolvers/zod';
import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors, toError } from '@monorepo/react/shared';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  useCreateRoom,
  useFilteredPropertyOptions,
  useUpdateRoom,
} from '../../../hooks';
import { createRoomMeta } from '../../../hooks/useCreateRoom/__generated__/useCreateRoom_meta.generated';
import { updateRoomMeta } from '../../../hooks/useUpdateRoom/__generated__/useUpdateRoom_meta.generated';
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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? createEmptyRoomFormData(),
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = methods;

  const { createRoom: createRoomMutation, loading: isCreating } =
    useCreateRoom();

  const { updateRoom: updateRoomMutation, loading: isUpdating } =
    useUpdateRoom();

  const isSubmitting = isCreating || isUpdating;

  const filteredPropertyOptions = useFilteredPropertyOptions(shelterId);

  async function submitRoom(data: RoomFormData) {
    setSubmissionError(null);

    try {
      if (roomId) {
        const response = await updateRoomMutation({
          variables: {
            id: roomId,
            data: buildUpdateRoomInput(data),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateRoomMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      } else {
        const response = await createRoomMutation({
          variables: {
            data: buildCreateRoomInput(data, shelterId),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...createRoomMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      }
      if (!roomId) {
        reset();
      }
      onSuccess?.();
    } catch (err) {
      const error = toError(err);
      console.error(
        `error ${roomId ? 'updating' : 'creating'} room: ${error.message}`
      );

      if (!(error instanceof BaError)) {
        setSubmissionError(
          `Unable to ${roomId ? 'update' : 'create'} room. Please try again.`
        );
      }
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
                : roomId
                ? 'Save Room'
                : 'Create Room'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
