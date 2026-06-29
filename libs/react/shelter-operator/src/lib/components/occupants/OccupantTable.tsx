import { useMemo } from 'react';
import { ReservationStatusChoices } from '../../apollo/graphql/__generated__/types';
import { StatusBadge } from '../base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from '../base-ui/table';
import { reservationStatusInfo } from '../reservations/reservation-form/constants/reservationFormOptions';

export type OccupantRow = {
  id: string;
  clientName: string;
  status: ReservationStatusChoices;
  roomName: string | null;
  bedName: string | null;
  startDate: string | null;
};

type OccupantTableProps = {
  rows: OccupantRow[];
  loading?: boolean;
};

export function OccupantTable({ rows, loading }: OccupantTableProps) {
  const columns: TableColumn<OccupantRow>[] = useMemo(
    () => [
      {
        key: 'client',
        label: 'Client',
        width: '1.5fr',
        cellClassName: 'min-w-0',
        sortValue: (row) => row.clientName,
        filterValue: (row) => row.clientName,
        render: (row) => (
          <span className="truncate text-sm font-medium text-gray-900">
            {row.clientName}
          </span>
        ),
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
        sortValue: (row) => (row.roomName ?? '') + (row.bedName ?? ''),
        filterValue: (row) => (row.roomName ?? '') + (row.bedName ?? ''),
        render: (row) => {
          const { roomName, bedName } = row;
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
    ],
    []
  );

  return (
    <Table
      columns={columns}
      rows={rows}
      labelClassName="text-lg"
      getRowKey={(row) => row.id}
      loading={loading}
      emptyState={
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          No occupants yet.
        </div>
      }
    />
  );
}
