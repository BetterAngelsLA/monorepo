import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { BedStatusChoices } from '../../../apollo/graphql/__generated__/types';
import { useCreateReservation } from '../../../hooks/useCreateReservation';
import { useUpdateReservation } from '../../../hooks/useUpdateReservation';
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
import type { SelectedClient } from '../components/ClientSearchInput';
import { createEmptyReservationFormData } from './constants/defaultReservationFormData';
import { formSchema } from './constants/formSchema';
import type { ReservationFormData } from './formTypes';
import { ReservationFormSection } from './sections/ReservationFormSection';
import {
    buildCreateReservationInput,
    buildUpdateReservationInput,
} from './utils/reservationFormInput';

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

  const allBeds = useMemo(() => bedsData?.beds.results ?? [], [bedsData]);

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

  const {
    createReservation,
    submitting: isCreating,
    error: createError,
    clearError: clearCreateError,
  } = useCreateReservation(shelterId);

  const {
    updateReservation,
    submitting: isUpdating,
    error: updateError,
    clearError: clearUpdateError,
  } = useUpdateReservation(shelterId);

  const submissionError = createError || updateError;
  const isSubmitting = isCreating || isUpdating;

  async function submitReservation(data: ReservationFormData) {
    if (isEditMode && reservationId) {
      const success = await updateReservation(
        reservationId,
        buildUpdateReservationInput(data)
      );
      if (!success) return;
    } else {
      const success = await createReservation(
        buildCreateReservationInput(data)
      );
      if (!success) return;
    }

    if (!isEditMode) {
      reset();
      setSelectedClients([]);
    }
    onSuccess?.();
  }

  function handleCancel() {
    reset();
    setSelectedClients([]);
    clearCreateError();
    clearUpdateError();
    onCancel?.();
  }

  const bedRoomError = errors.bedId?.message;

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
            onPrimaryClick={handleSubmit(submitReservation)}
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
