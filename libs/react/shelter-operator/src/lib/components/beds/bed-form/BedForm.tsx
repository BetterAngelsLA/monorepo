import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Form } from '../../form/Form';
import {
  GetRoomsDocument,
  type GetRoomsQuery,
  type GetRoomsQueryVariables,
} from '../../rooms/api/__generated__/roomQueries.generated';
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
import { createEmptyBedFormData } from './constants/defaultBedFormData';
import { formSchema } from './constants/validation';
import type { BedFormData } from './formTypes';
import { BasicInformationSection } from './sections/BasicInformationSection';
import { BedDetailsSection } from './sections/BedDetailsSection';
import { GetBedsDocument } from '../api/__generated__/bedQueries.generated';

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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<BedFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? createEmptyBedFormData(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = methods;

  const { data: roomsData } = useQuery<GetRoomsQuery, GetRoomsQueryVariables>(
    GetRoomsDocument,
    {
      variables: { shelterId },
      skip: !shelterId,
    }
  );

  const roomOptions = useMemo(
    () =>
      (roomsData?.rooms.results ?? []).map((room) => ({
        value: room.id,
        label: room.name,
      })),
    [roomsData?.rooms.results]
  );

  const refetchQueries = useMemo(
    () => [{ query: GetBedsDocument, variables: { shelterId } }],
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

  async function submitBed(data: BedFormData) {
    setSubmissionError(null);

    try {
      if (isEditMode && bedId) {
        const { data: result } = await updateBed({
          variables: {
            id: bedId,
            data: buildUpdateBedInput(data),
          },
          errorPolicy: 'all',
        });

        if (result?.updateBed?.__typename === 'OperationInfo') {
          const firstMessage = result.updateBed.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to update bed. Please try again.'
          );
          return;
        }
      } else {
        const { data: result } = await createBed({
          variables: {
            data: buildCreateBedInput(data, shelterId),
          },
          errorPolicy: 'all',
        });

        if (result?.createBed?.__typename === 'OperationInfo') {
          const firstMessage = result.createBed.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to create bed. Please try again.'
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
  }

  function handleCancel() {
    reset();
    onCancel?.();
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-4 pb-48">
        {submissionError ? (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {submissionError}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit(submitBed)}
          className="space-y-6"
          data-testid="bed-form"
        >
          <BasicInformationSection
            control={control}
            errors={errors}
            roomOptions={roomOptions}
          />
          <BedDetailsSection
            control={control}
            errors={errors}
            roomOptions={roomOptions}
          />

          <Form.Actions
            onPrimaryClick={() => handleSubmit(submitBed)()}
            onSecondaryClick={onCancel ? handleCancel : undefined}
            primaryDisabled={isSubmitting || !isValid}
            secondaryDisabled={isSubmitting}
            primaryLabel={
              isSubmitting
                ? 'Submitting…'
                : isEditMode
                  ? 'Save Bed'
                  : 'Create Bed'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
