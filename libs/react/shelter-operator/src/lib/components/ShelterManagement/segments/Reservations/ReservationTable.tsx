import { ReservationStatusChoices } from '@monorepo/ba-platform/types';
import { formatClientDisplayName } from '@monorepo/react/shared';
import { Check, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { ReservationsQuery } from '../../../../hooks/useReservations/__generated__/useReservations.generated';
import { Button } from '../../../base-ui/buttons';
import { StatusBadge } from '../../../base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from '../../../base-ui/table';
import { tableEmptyState } from '../tableEmptyState';
import { reservationStatusInfo } from './ReservationForm';
import { isoToDateSafe } from '@monorepo/shared/scalars';

const CONFIRM_ELIGIBLE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckInOverdue,
  ReservationStatusChoices.CheckedIn,
]);

const CANCEL_ELIGIBLE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckInOverdue,
]);

export type Reservation = NonNullable<
  ReservationsQuery['reservations']['results'][number]
>;

type ReservationTableProps = {
  reservations: Reservation[];
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  isConfirmActionLoading?: boolean;
  isCancelActionLoading?: boolean;
  onEdit: (reservationId: string) => void;
  onCheckIn: (reservationId: string) => void;
  onComplete: (reservationId: string) => void;
  onCancel: (reservationId: string) => void;
  wrapperClassName?: string;
  headerClassName?: string;
  headerInsetClassName?: string;
  rowClassName?: string;
  rowInsetClassName?: string;
  tableStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  rowStyle?: CSSProperties;
  trailingColumnWidth?: string;
};

function getEffectiveCheckIn(reservation: Reservation): {
  date: string | null;
  isScheduled: boolean;
} {
  const isActual =
    reservation.status === ReservationStatusChoices.CheckedIn ||
    reservation.status === ReservationStatusChoices.Completed;
  return isActual
    ? { date: reservation.checkedInAt ?? null, isScheduled: false }
    : { date: reservation.startDate ?? null, isScheduled: true };
}

export function ReservationTable({
  reservations,
  loading,
  loadingState,
  emptyState = tableEmptyState('No reservations yet.'),
  isConfirmActionLoading,
  isCancelActionLoading,
  onEdit,
  onCheckIn,
  onComplete,
  onCancel,
  wrapperClassName,
  headerClassName,
  headerInsetClassName,
  rowClassName,
  rowInsetClassName,
  tableStyle,
  headerStyle,
  rowStyle,
  trailingColumnWidth = '140px',
}: ReservationTableProps) {
  const columns: TableColumn<Reservation>[] = useMemo(
    () => [
      {
        key: 'client',
        label: 'Client',
        width: '1.5fr',
        sortValue: (reservation) => {
          const clients = reservation.clients ?? [];
          if (clients.length === 0) return '';
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          return primary.clientProfile
            ? formatClientDisplayName(primary.clientProfile)
            : '';
        },
        filterValue: (reservation) => {
          const clients = reservation.clients ?? [];
          if (clients.length === 0) return '';
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          return primary.clientProfile
            ? formatClientDisplayName(primary.clientProfile)
            : '';
        },
        render: (reservation) => {
          const clients = reservation.clients ?? [];
          if (clients.length === 0)
            return <span className="text-gray-400">—</span>;
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          const primaryProfile = primary.clientProfile;
          const primaryDisplayName = primaryProfile
            ? formatClientDisplayName(primaryProfile)
            : '';
          return (
            <div className="flex items-center gap-1.5">
              {primaryDisplayName}
              {clients.length > 1 && (
                <span className="text-xs text-gray-500">
                  +{clients.length - 1}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '1fr',
        sortValue: (reservation) =>
          reservationStatusInfo(reservation.status).label,
        filterValue: (reservation) =>
          reservationStatusInfo(reservation.status).label,
        autoFilterOptions: true,
        render: (reservation) => {
          const info = reservationStatusInfo(reservation.status);
          return <StatusBadge label={info.label} variant={info.variant} />;
        },
      },
      {
        key: 'assignments',
        label: 'Room / Bed',
        width: '1.5fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (reservation) =>
          (reservation.room?.name ?? '') + (reservation.bed?.name ?? ''),
        filterValue: (reservation) =>
          (reservation.room?.name ?? '') + (reservation.bed?.name ?? ''),
        render: (reservation) => {
          const roomName = reservation.room?.name;
          const bedName = reservation.bed?.name;
          if (roomName && bedName) {
            return (
              <>
                {roomName} &middot; {bedName}
              </>
            );
          }
          if (roomName) return <span>{roomName}</span>;
          if (bedName) return <span>{bedName}</span>;
          return <span className="text-gray-400">—</span>;
        },
      },
      {
        key: 'checkedInAt',
        label: 'Check-In',
        width: '0.9fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (reservation) => getEffectiveCheckIn(reservation).date ?? '',
        filterValue: (reservation) =>
          getEffectiveCheckIn(reservation).date ?? '',
        render: (reservation) => {
          const { date, isScheduled } = getEffectiveCheckIn(reservation);
          const parsed = isoToDateSafe(date);
          if (!parsed) return <span className="text-gray-400">—</span>;
          const label = parsed.toLocaleDateString();
          return <span>{isScheduled ? `${label} (sched.)` : label}</span>;
        },
      },
      {
        key: 'checkedOutAt',
        label: 'Check-Out',
        width: '0.9fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (reservation) => reservation.checkedOutAt ?? '',
        filterValue: (reservation) => reservation.checkedOutAt ?? '',
        render: (reservation) =>
          reservation.checkedOutAt ? (
            <span>
              {new Date(reservation.checkedOutAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <Table
      columns={columns}
      rows={reservations}
      getRowKey={(reservation) => reservation.id}
      getRowSlot={(reservation) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Reservation actions"
        >
          {CONFIRM_ELIGIBLE_STATUSES.has(reservation.status) && (
            <Button
              type="button"
              variant="confirm"
              className="text-[#747A82]"
              aria-label={
                reservation.status === ReservationStatusChoices.CheckedIn
                  ? 'Mark completed'
                  : 'Mark checked in'
              }
              leftIcon={<Check size={24} stroke="black" />}
              disabled={isConfirmActionLoading}
              onClick={() => {
                if (reservation.status === ReservationStatusChoices.CheckedIn) {
                  onComplete(reservation.id);
                } else {
                  onCheckIn(reservation.id);
                }
              }}
            />
          )}
          {CANCEL_ELIGIBLE_STATUSES.has(reservation.status) && (
            <Button
              type="button"
              variant="trash"
              className="text-[#747A82]"
              aria-label="Cancel reservation"
              leftIcon={<X size={24} stroke="black" />}
              disabled={isCancelActionLoading}
              onClick={() => onCancel(reservation.id)}
            />
          )}
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            aria-label="Edit reservation"
            onClick={() => onEdit(reservation.id)}
          />
        </div>
      )}
      trailingColumnWidth={trailingColumnWidth}
      loading={loading}
      loadingState={loadingState}
      emptyState={emptyState}
      wrapperClassName={wrapperClassName}
      headerClassName={headerClassName}
      headerInsetClassName={headerInsetClassName}
      rowClassName={rowClassName}
      rowInsetClassName={rowInsetClassName}
      tableStyle={tableStyle}
      headerStyle={headerStyle}
      rowStyle={rowStyle}
    />
  );
}
