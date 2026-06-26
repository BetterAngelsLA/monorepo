import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isMutationSuccess } from '@monorepo/react/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { BedStatusChoices } from '../../../apollo/graphql/__generated__/types';
import {
  GetBedsDocument,
  type GetBedsQuery,
  type GetBedsQueryVariables,
} from '../../beds/api/__generated__/bedQueries.generated';
import { Form } from '../../form/Form';
import {
  GetRoomsDocument,
  type GetRoomsQuery,
  type GetRoomsQueryVariables,
} from '../../rooms/api/__generated__/roomQueries.generated';
import { GetReservationsDocument } from '../api/__generated__/reservationQueries.generated';
import {
  CreateReservationDocument,
  buildCreateReservationInput,
  buildUpdateReservationInput,
  type CreateReservationMutation,
  type CreateReservationMutationVariables,
} from '../api/createReservationMutation';
import {
  UpdateReservationDocument,
  type UpdateReservationMutation,
  type UpdateReservationMutationVariables,
} from '../api/updateReservationMutation';
import type { SelectedClient } from '../components/ClientSearchInput';
import { createEmptyReservationFormData } from './constants/defaultReservationFormData';
import { formSchema } from './constants/validation';
import type { ReservationFormData } from './formTypes';
import { ReservationFormSection } from './sections/ReservationFormSection';

export type ReservationFormProps = {
  shelterId: string;
  reservationId?: string;
  initialData?: ReservationFormData;
  initialSelectedClients?: SelectedClient[];
  readOnlyFields?: ('bedId' | 'roomId')[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ReservationForm({
  shelterId,
  reservationId,
  initialData,
  initialSelectedClients,
  readOnlyFields: initialReadOnly,
  onSuccess,
  onCancel,
}: ReservationFormProps) {
  const isEditMode = Boolean(reservationId);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const initialBedIdRef = useRef(initialData?.bedId ?? null);

  const defaults = createEmptyReservationFormData();

  const methods = useForm<ReservationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? defaults,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = methods;

  const watchedBedId = useWatch({ name: 'bedId', control });
  const watchedRoomId = useWatch({ name: 'roomId', control });
  const watchedClientIds = useWatch({ name: 'clientIds', control });
  const watchedPrimaryClientId = useWatch({
    name: 'primaryClientId',
    control,
  });

  const [selectedClients, setSelectedClients] = useState<SelectedClient[]>(
    () => initialSelectedClients ?? []
  );

  const handleAddClient = useCallback(
    (client: SelectedClient) => {
      const newIds = watchedClientIds.includes(client.id)
        ? watchedClientIds
        : [...watchedClientIds, client.id];
      setValue('clientIds', newIds, { shouldValidate: true });
      setSelectedClients((prev) => {
        if (prev.some((c) => c.id === client.id)) return prev;
        return [...prev, client];
      });
      // Auto-set as primary if this is the first client
      if (!watchedPrimaryClientId && newIds.length === 1) {
        setValue('primaryClientId', client.id);
      }
    },
    [watchedClientIds, watchedPrimaryClientId, setValue]
  );

  const handleRemoveClient = useCallback(
    (clientId: string) => {
      const newIds = watchedClientIds.filter((id) => id !== clientId);
      setValue('clientIds', newIds, { shouldValidate: true });
      setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
      // If removing the primary, set the next client (if any) as primary
      if (clientId === watchedPrimaryClientId) {
        setValue('primaryClientId', newIds.length > 0 ? newIds[0] : null);
      }
    },
    [watchedClientIds, watchedPrimaryClientId, setValue]
  );

  const handleSetPrimary = useCallback(
    (clientId: string) => {
      setValue('primaryClientId', clientId);
    },
    [setValue]
  );

  const { data: bedsData } = useQuery<GetBedsQuery, GetBedsQueryVariables>(
    GetBedsDocument,
    {
      variables: { shelterId },
      skip: !shelterId,
    }
  );

  const allBeds = bedsData?.beds.results ?? [];

  const allBedOptions = useMemo(
    () =>
      allBeds.map((bed) => ({
        value: bed.id,
        label: `${bed.name ?? ''}${bed.room ? ` (${bed.room.name})` : ''}`,
        roomId: bed.room?.id ?? null,
      })),
    [allBeds]
  );

  const { data: roomsData } = useQuery<GetRoomsQuery, GetRoomsQueryVariables>(
    GetRoomsDocument,
    {
      variables: { shelterId },
      skip: !shelterId,
    }
  );

  const allRoomOptions = useMemo(
    () =>
      (roomsData?.rooms.results ?? []).map((room) => ({
        value: room.id,
        label: room.name,
      })),
    [roomsData?.rooms.results]
  );

  // ─── Dynamic read-only & filtering ──────────────────────────────────────

  const openedFromBed = initialReadOnly?.includes('bedId') ?? false;
  const openedFromRoom =
    !openedFromBed && (initialReadOnly?.includes('roomId') ?? false);
  const openedFromRes = !openedFromBed && !openedFromRoom;

  const effectiveReadOnlyFields: ('bedId' | 'roomId')[] = useMemo(() => {
    if (openedFromBed) return ['bedId', 'roomId'];
    if (openedFromRoom) return ['roomId'];
    return [];
  }, [openedFromBed, openedFromRoom]);

  // Free-form only: auto-populate room when a bed with a room is selected.
  useEffect(() => {
    if (!openedFromRes || !watchedBedId) return;
    const bed = allBedOptions.find((b) => b.value === watchedBedId);
    if (bed?.roomId) {
      setValue('roomId', bed.roomId);
    }
  }, [openedFromRes, watchedBedId, allBedOptions, setValue]);

  // When the room changes, clear bedId if the current bed doesn't belong to the new room.
  useEffect(() => {
    if (!watchedBedId || !watchedRoomId) return;
    const bed = allBedOptions.find((b) => b.value === watchedBedId);
    if (bed?.roomId && bed.roomId !== watchedRoomId) {
      setValue('bedId', null);
    }
  }, [watchedRoomId, watchedBedId, allBedOptions, setValue]);

  // Filter bed options: only show available beds, and when a room is selected,
  // show only beds in that room. In edit mode, always include the currently
  // selected bed and the originally assigned bed so they remain visible.
  const bedOptions = useMemo(() => {
    const availableBeds = allBeds.filter((bed) => {
      if (bed.status === BedStatusChoices.Available) return true;
      if (
        isEditMode &&
        (bed.id === watchedBedId || bed.id === initialBedIdRef.current)
      )
        return true;
      return false;
    });
    const availableOptions = availableBeds.map((bed) => ({
      value: bed.id,
      label: `${bed.name ?? ''}${bed.room ? ` (${bed.room.name})` : ''}`,
      roomId: bed.room?.id ?? null,
    }));
    if (watchedRoomId) {
      return availableOptions.filter((b) => b.roomId === watchedRoomId);
    }
    return availableOptions;
  }, [allBeds, watchedRoomId, isEditMode, watchedBedId]);

  // ─── Mutations ──────────────────────────────────────────────────────────

  const refetchQueries = useMemo(
    () => [
      { query: GetBedsDocument, variables: { shelterId } },
      { query: GetRoomsDocument, variables: { shelterId } },
      { query: GetReservationsDocument, variables: { shelterId } },
    ],
    [shelterId]
  );

  const [createReservation, { loading: isCreating }] = useMutation<
    CreateReservationMutation,
    CreateReservationMutationVariables
  >(CreateReservationDocument, { refetchQueries });

  const [updateReservation, { loading: isUpdating }] = useMutation<
    UpdateReservationMutation,
    UpdateReservationMutationVariables
  >(UpdateReservationDocument, { refetchQueries });

  const isSubmitting = isCreating || isUpdating;

  async function submitReservation(data: ReservationFormData) {
    setSubmissionError(null);

    try {
      if (isEditMode && reservationId) {
        const { data: result } = await updateReservation({
          variables: {
            id: reservationId,
            data: buildUpdateReservationInput(data),
          },
          errorPolicy: 'all',
        });

        if (result?.updateReservation?.__typename === 'OperationInfo') {
          const firstMessage = result.updateReservation.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to update reservation. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.updateReservation, 'ReservationType')) {
          setSubmissionError('An unexpected error occurred. Please try again.');
          return;
        }
      } else {
        const { data: result } = await createReservation({
          variables: {
            data: buildCreateReservationInput(data),
          },
          errorPolicy: 'all',
        });

        if (result?.createReservation?.__typename === 'OperationInfo') {
          const firstMessage = result.createReservation.messages?.[0]?.message;
          setSubmissionError(
            firstMessage || 'Unable to create reservation. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.createReservation, 'ReservationType')) {
          setSubmissionError('An unexpected error occurred. Please try again.');
          return;
        }
      }

      if (!isEditMode) {
        reset();
        setSelectedClients([]);
      }
      onSuccess?.();
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
    }
  }

  function handleCancel() {
    reset();
    setSelectedClients([]);
    onCancel?.();
  }

  const bedRoomError = errors.bedId?.message;

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
          onSubmit={handleSubmit(submitReservation)}
          className="space-y-6"
          data-testid="reservation-form"
        >
          <ReservationFormSection
            control={control}
            errors={errors}
            bedOptions={bedOptions.map(({ value, label }) => ({
              value,
              label,
            }))}
            roomOptions={allRoomOptions}
            bedRoomError={bedRoomError}
            readOnlyFields={effectiveReadOnlyFields}
            selectedClients={selectedClients}
            primaryClientId={watchedPrimaryClientId}
            onAddClient={handleAddClient}
            onRemoveClient={handleRemoveClient}
            onSetPrimary={handleSetPrimary}
          />

          <Form.Actions
            onPrimaryClick={() => handleSubmit(submitReservation)()}
            onSecondaryClick={onCancel ? handleCancel : undefined}
            primaryDisabled={isSubmitting || !isValid}
            secondaryDisabled={isSubmitting}
            primaryLabel={
              isSubmitting
                ? 'Submitting…'
                : isEditMode
                ? 'Save Reservation'
                : 'Create Reservation'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
