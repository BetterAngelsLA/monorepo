import { formatClientDisplayName } from '@monorepo/react/shared';
import { Check, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationStatusChoices } from '../apollo/graphql/__generated__/types';
import { shelterEditReservationRoute } from '../routing';
import { Button } from './base-ui/buttons';
import { StatusBadge } from './base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from './base-ui/table';
import type { GetReservationsQuery } from './reservations/api/__generated__/reservationQueries.generated';
import { reservationStatusInfo } from './reservations/reservation-form/constants/reservationFormOptions';

const CONFIRM_ELIGIBLE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckInOverdue,
  ReservationStatusChoices.CheckedIn,
]);

const CANCEL_ELIGIBLE_STATUSES: Set<ReservationStatusChoices> = new Set([
  ReservationStatusChoices.Confirmed,
  ReservationStatusChoices.CheckInOverdue,
]);

type ReservationRow = NonNullable<
  GetReservationsQuery['reservations']['results'][number]
>;

type ReservationTableProps = {
  rows: ReservationRow[];
  shelterId: string;
  loading?: boolean;
  isConfirmActionLoading?: boolean;
  isCancelActionLoading?: boolean;
  onCheckIn?: (reservationId: string) => void;
  onComplete?: (reservationId: string) => void;
  onCancel?: (reservationId: string) => void;
};

export function ReservationTable({
  rows,
  shelterId,
  loading,
  isConfirmActionLoading,
  isCancelActionLoading,
  onCheckIn,
  onComplete,
  onCancel,
}: ReservationTableProps) {
  const navigate = useNavigate();

  const columns: TableColumn<ReservationRow>[] = useMemo(
    () => [
      {
        key: 'client',
        label: 'Client',
        width: '1.5fr',
        cellClassName: 'min-w-0',
        sortValue: (row) => {
          const clients = row.clients ?? [];
          if (clients.length === 0) return '';
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          return primary.clientProfile
            ? formatClientDisplayName(primary.clientProfile)
            : '';
        },
        filterValue: (row) => {
          const clients = row.clients ?? [];
          if (clients.length === 0) return '';
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          return primary.clientProfile
            ? formatClientDisplayName(primary.clientProfile)
            : '';
        },
        render: (row) => {
          const clients = row.clients ?? [];
          if (clients.length === 0)
            return <span className="text-gray-400">—</span>;
          const primary = clients.find((c) => c.isPrimary) ?? clients[0];
          const primaryProfile = primary.clientProfile;
          const primaryDisplayName = primaryProfile
            ? formatClientDisplayName(primaryProfile)
            : '';
          return (
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-gray-900">
                {primaryDisplayName}
              </span>
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
        sortValue: (row) => reservationStatusInfo(row.status).label,
        filterValue: (row) => reservationStatusInfo(row.status).label,
        autoFilterOptions: true,
        render: (row) => {
          const info = reservationStatusInfo(row.status);
          return <StatusBadge label={info.label} variant={info.variant} />;
        },
      },
      {
        key: 'assignments',
        label: 'Room / Bed',
        width: '1.5fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (row) => (row.room?.name ?? '') + (row.bed?.name ?? ''),
        filterValue: (row) => (row.room?.name ?? '') + (row.bed?.name ?? ''),
        render: (row) => {
          const roomName = row.room?.name;
          const bedName = row.bed?.name;
          if (roomName && bedName) {
            return (
              <span>
                {roomName} &middot; {bedName}
              </span>
            );
          }
          if (roomName) return <span>{roomName}</span>;
          if (bedName) return <span>{bedName}</span>;
          return <span className="text-gray-400">—</span>;
        },
      },
      {
        key: 'startDate',
        label: 'Sched. Check-In',
        width: '0.9fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (row) => row.startDate ?? '',
        filterValue: (row) => row.startDate ?? '',
        render: (row) =>
          row.startDate ? (
            <span>{new Date(row.startDate).toLocaleDateString()}</span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: 'checkedOutAt',
        label: 'Check-Out',
        width: '0.9fr',
        cellClassName: 'text-sm text-gray-700',
        sortValue: (row) => row.checkedOutAt ?? '',
        filterValue: (row) => row.checkedOutAt ?? '',
        render: (row) =>
          row.checkedOutAt ? (
            <span>{new Date(row.checkedOutAt).toLocaleDateString()}</span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
    ],
    []
  );

  return (
    <Table
      columns={columns}
      rows={rows}
      labelClassName="text-lg"
      getRowKey={(row) => row.id}
      getRowSlot={(rowObject) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Reservation actions"
        >
          {CONFIRM_ELIGIBLE_STATUSES.has(rowObject.status) && (
            <Button
              type="button"
              variant="confirm"
              className="text-[#747A82]"
              aria-label={
                rowObject.status === ReservationStatusChoices.CheckedIn
                  ? 'Mark completed'
                  : 'Mark checked in'
              }
              leftIcon={<Check size={24} stroke="black" />}
              disabled={isConfirmActionLoading}
              onClick={() => {
                if (rowObject.status === ReservationStatusChoices.CheckedIn) {
                  onComplete?.(rowObject.id);
                } else {
                  onCheckIn?.(rowObject.id);
                }
              }}
            />
          )}
          {CANCEL_ELIGIBLE_STATUSES.has(rowObject.status) && (
            <Button
              type="button"
              variant="trash"
              className="text-[#747A82]"
              aria-label="Cancel reservation"
              leftIcon={<X size={24} stroke="black" />}
              disabled={isCancelActionLoading}
              onClick={() => onCancel?.(rowObject.id)}
            />
          )}
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            aria-label="Edit reservation"
            onClick={() =>
              navigate(shelterEditReservationRoute(shelterId, rowObject.id))
            }
          />
        </div>
      )}
      trailingColumnWidth="140px"
      loading={loading}
      emptyState={
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          No reservations yet.
        </div>
      }
    />
  );
}
