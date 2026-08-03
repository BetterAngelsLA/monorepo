import { ReservationStatusChoices } from '@monorepo/ba-platform/types';
import { z } from 'zod';
import type { UseReservationResultType } from '../../../../../hooks/useReservation';
import { toDropdownOptions } from '../../../../base-ui/dropdown';
import type { StatusBadgeVariant } from '../../../../base-ui/status-badge/StatusBadge';
import type { SelectedClient } from './sections/ClientSearchInput';

export type ReservationFormData = z.infer<typeof formSchema>;

export const formSchema = z
  .object({
    bedId: z.string().nullable(),
    roomId: z.string().nullable(),
    clientIds: z.array(z.string()).min(1, 'At least one client is required'),
    primaryClientId: z.string().nullable(),
    status: z.enum(ReservationStatusChoices),
    startDate: z.string().min(1, 'Start date is required'),
    notes: z.string(),
  })
  .refine((data) => data.bedId || data.roomId, {
    message: 'At least one of Bed or Room must be selected.',
    path: ['bedId'],
  })
  .refine(
    (data) => {
      if (data.clientIds.length <= 1) return true;
      return (
        data.primaryClientId !== null &&
        data.clientIds.includes(data.primaryClientId)
      );
    },
    {
      message:
        'A primary client must be selected when there are multiple clients.',
      path: ['primaryClientId'],
    },
  );

export const RESERVATION_STATUS_LABELS: Record<
  ReservationStatusChoices,
  string
> = {
  [ReservationStatusChoices.Confirmed]: 'Confirmed',
  [ReservationStatusChoices.CheckedIn]: 'Checked In',
  [ReservationStatusChoices.Completed]: 'Completed',
  [ReservationStatusChoices.Cancelled]: 'Cancelled',
  [ReservationStatusChoices.CheckInOverdue]: 'Check-In Overdue',
};

export const RESERVATION_STATUS_OPTIONS = toDropdownOptions(
  RESERVATION_STATUS_LABELS,
);

export function reservationStatusInfo(status: ReservationStatusChoices): {
  label: string;
  variant: StatusBadgeVariant;
} {
  return {
    label: RESERVATION_STATUS_LABELS[status] ?? status,
    variant: reservationStatusToBadgeVariant(status),
  };
}

function reservationStatusToBadgeVariant(
  status: ReservationStatusChoices,
): StatusBadgeVariant {
  switch (status) {
    case ReservationStatusChoices.Confirmed:
      return 'confirmed';
    case ReservationStatusChoices.CheckedIn:
      return 'checked-in';
    case ReservationStatusChoices.Completed:
      return 'completed';
    case ReservationStatusChoices.Cancelled:
      return 'cancelled';
    case ReservationStatusChoices.CheckInOverdue:
      return 'check-in-overdue';
    default:
      return 'unknown';
  }
}

export const createEmptyReservationFormData = (): ReservationFormData => ({
  bedId: null,
  roomId: null,
  clientIds: [],
  primaryClientId: null,
  status: ReservationStatusChoices.Confirmed,
  startDate: '',
  notes: '',
});

export function toFormData(
  reservation: UseReservationResultType,
): ReservationFormData {
  const defaults = createEmptyReservationFormData();
  const primaryAssignment = reservation.clients.find((c) => c.isPrimary);

  return {
    ...defaults,
    bedId: reservation.bed?.id ?? null,
    roomId: reservation.room?.id ?? null,
    clientIds: reservation.clients.map((c) => c.clientProfile.id),
    primaryClientId: primaryAssignment?.clientProfile.id ?? null,
    status: reservation.status ?? defaults.status,
    startDate: reservation.startDate ?? '',
    notes: reservation.notes ?? '',
  };
}

export function toSelectedClients(
  reservation: UseReservationResultType,
): SelectedClient[] {
  return reservation.clients.map((c) => ({
    id: c.clientProfile.id,
    firstName: c.clientProfile.firstName,
    middleName: c.clientProfile.middleName,
    lastName: c.clientProfile.lastName,
    nickname: c.clientProfile.nickname,
  }));
}
