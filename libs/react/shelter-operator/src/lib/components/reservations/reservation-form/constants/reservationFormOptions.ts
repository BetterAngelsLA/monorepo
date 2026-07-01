import { ReservationStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import { toDropdownOptions } from '../../../base-ui/dropdown';
import type { StatusBadgeVariant } from '../../../base-ui/status-badge/StatusBadge';

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
  status: ReservationStatusChoices
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

export const RESERVATION_STATUS_OPTIONS = toDropdownOptions(
  RESERVATION_STATUS_LABELS
);
