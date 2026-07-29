import { zodResolver } from '@hookform/resolvers/zod';
import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors, toError } from '@monorepo/react/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { BedStatusChoices } from '@monorepo/ba-platform/types';
import { useBeds, useRooms } from '../../../hooks';
import { useCreateReservation } from '../../../hooks/useCreateReservation';
import { useUpdateReservation } from '../../../hooks/useUpdateReservation';
import { Form } from '../../form/Form';

import { createReservationMeta } from '../../../hooks/useCreateReservation/__generated__/useCreateReservation_meta.generated';
import { updateReservationMeta } from '../../../hooks/useUpdateReservation/__generated__/useUpdateReservation_meta.generated';
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
    setError,
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
    () => initialSelectedClients ?? [],
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
    [watchedClientIds, watchedPrimaryClientId, setValue],
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
    [watchedClientIds, watchedPrimaryClientId, setValue],
  );

  const handleSetPrimary = useCallback(
    (clientId: string) => {
      setValue('primaryClientId', clientId);
    },
    [setValue],
  );

  const { beds } = useBeds(shelterId);

  const allBeds = useMemo(
    () =>
      beds.map((bed) => ({
        value: bed.id,
        label: `${bed.name ?? ''}${bed.room ? ` (${bed.room.name})` : ''}`,
        roomId: bed.room?.id ?? null,
      })),
    [beds],
  );

  const { rooms } = useRooms(shelterId);

  const roomOptions = useMemo(
    () =>
      (rooms ?? []).map((room) => ({
        value: room.id,
        label: room.name,
      })),
    [rooms],
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
    const bed = allBeds.find((b) => b.value === watchedBedId);
    if (bed?.roomId) {
      setValue('roomId', bed.roomId);
    }
  }, [openedFromRes, watchedBedId, allBeds, setValue]);

  // When the room changes, clear bedId if the current bed doesn't belong to the new room.
  useEffect(() => {
    if (!watchedBedId || !watchedRoomId) return;
    const bed = allBeds.find((b) => b.value === watchedBedId);
    if (bed?.roomId && bed.roomId !== watchedRoomId) {
      setValue('bedId', null);
    }
  }, [watchedRoomId, watchedBedId, allBeds, setValue]);

  // Filter bed options: only show available beds, and when a room is selected,
  // show only beds in that room. In edit mode, always include the currently
  // selected bed and the originally assigned bed so they remain visible.
  const bedOptions = useMemo(() => {
    const availableBeds = beds.filter((bed) => {
      if (bed.status === BedStatusChoices.Available) return true;
      if (
        reservationId &&
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
  }, [beds, watchedRoomId, reservationId, watchedBedId]);

  // ─── Mutations ──────────────────────────────────────────────────────────

  const { createReservation, loading: isCreating } = useCreateReservation({
    shelterId,
  });

  const { updateReservation, loading: isUpdating } = useUpdateReservation({
    shelterId,
  });

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isSubmitting = isCreating || isUpdating;

  async function submitReservation(data: ReservationFormData) {
    setSubmissionError(null);

    try {
      if (reservationId) {
        const response = await updateReservation({
          variables: {
            id: reservationId,
            data: buildUpdateReservationInput(data),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateReservationMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      } else {
        const response = await createReservation({
          variables: {
            data: buildCreateReservationInput(data),
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...createReservationMeta,
          fields: Object.keys(formSchema.shape),
        });

        if (fieldErrors.length) {
          applyFieldErrors(fieldErrors, setError);
          throw new BaError('Please see validation messages.');
        }
      }
      if (!reservationId) {
        reset();
        setSelectedClients([]);
      }
      onSuccess?.();
    } catch (err) {
      const error = toError(err);
      console.error(
        `error ${reservationId ? 'updating' : 'creating'} reservation: ${error.message}`,
      );

      if (!(error instanceof BaError)) {
        setSubmissionError(
          `Unable to ${reservationId ? 'update' : 'create'} reservation. Please try again.`,
        );
      }
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
            roomOptions={roomOptions}
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
                : reservationId
                  ? 'Save Reservation'
                  : 'Create Reservation'
            }
          />
        </form>
      </div>
    </FormProvider>
  );
}
