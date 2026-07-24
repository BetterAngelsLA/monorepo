import { zodResolver } from '@hookform/resolvers/zod';
import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors, toError } from '@monorepo/react/shared';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  useCreateBed,
  useFilteredPropertyOptions,
  useRooms,
  useUpdateBed,
} from '../../../../../hooks';
import { createBedMeta } from '../../../../../hooks/useCreateBed/__generated__/useCreateBed_meta.generated';
import { updateBedMeta } from '../../../../../hooks/useUpdateBed/__generated__/useUpdateBed_meta.generated';
import { Form } from '../../../../form/Form';
import { buildCreateBedInput, buildUpdateBedInput } from './bedFormInput';
import {
  type BedFormData,
  createEmptyBedFormData,
  formSchema,
} from './formSchema';
import { BedBasicInfo } from './sections/BedBasicInfo';
import { BedDetails } from './sections/BedDetails';

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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<BedFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? createEmptyBedFormData(),
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = methods;

  const { rooms } = useRooms(shelterId);
  const roomOptions = useMemo(
    () =>
      (rooms ?? []).map((room) => ({
        value: room.id,
        label: room.name,
      })),
    [rooms],
  );

  const filteredPropertyOptions = useFilteredPropertyOptions(shelterId);

  const { createBed: createBedMutation, loading: isCreating } = useCreateBed({
    shelterId,
  });

  const { updateBed: updateBedMutation, loading: isUpdating } = useUpdateBed();

  const isSubmitting = isCreating || isUpdating;

  async function submitBed(data: BedFormData) {
    setSubmissionError(null);

    try {
      if (bedId) {
        const response = await updateBedMutation({
          variables: {
            id: bedId,
            data: buildUpdateBedInput(data),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateBedMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      } else {
        const response = await createBedMutation({
          variables: {
            data: buildCreateBedInput(data, shelterId),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...createBedMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      }

      if (!bedId) {
        reset();
      }
      onSuccess?.();
    } catch (err) {
      const error = toError(err);
      console.error(
        `error ${bedId ? 'updating' : 'creating'} bed: ${error.message}`,
      );

      if (!(error instanceof BaError)) {
        setSubmissionError(
          `Unable to ${bedId ? 'update' : 'create'} bed. Please try again.`,
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
          onSubmit={handleSubmit(submitBed)}
          className="space-y-6"
          data-testid="bed-form"
        >
          <BedBasicInfo
            control={control}
            errors={errors}
            roomOptions={roomOptions}
          />
          <BedDetails
            control={control}
            errors={errors}
            filteredPropertyOptions={filteredPropertyOptions}
          />

          <Form.Actions
            onPrimaryClick={() => handleSubmit(submitBed)()}
            onSecondaryClick={onCancel ? handleCancel : undefined}
            primaryDisabled={isSubmitting || !isValid}
            secondaryDisabled={isSubmitting}
            primaryLabel={
              isSubmitting ? 'Submitting…' : bedId ? 'Save Bed' : 'Create Bed'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
