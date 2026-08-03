import { BedStatusChoices } from '@monorepo/ba-platform/types';
import { BookCheck, CopyPlus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { Button } from '../../../base-ui/buttons';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from '../../../base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from '../../../base-ui/table';
import { tableEmptyState } from '../tableEmptyState';

export type Bed = {
  id: string;
  name?: string | null;
  status: BedStatusChoices;
  maintenanceFlag: boolean;
  room?: { id: string; name: string } | null;
};

type BedTableProps = {
  beds: Bed[];
  getRowKey?: (bed: Bed, index: number) => string;
  onRowClick?: (bed: Bed, rowIndex: number) => void;
  onClone: (bedId: string) => void;
  onEdit: (bedId: string) => void;
  onDeleteBeds: (bedIds: string[]) => void;
  onMarkReady: (bedId: string) => void;
  onReserve: (bed: Bed) => void;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  headerInsetClassName?: string;
  rowClassName?: string;
  rowInsetClassName?: string;
  tableStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  rowStyle?: CSSProperties;
};

function bedStatusInfo(
  status: BedStatusChoices | null | undefined,
  maintenanceFlag?: boolean,
): { label: string; variant: StatusBadgeVariant } {
  if (status === BedStatusChoices.OutOfService && maintenanceFlag) {
    return {
      label: 'Out of Service - Maintenance',
      variant: 'out-of-service-maintenance',
    };
  }
  switch (status) {
    case BedStatusChoices.Available:
      return { label: 'Available', variant: 'available' };
    case BedStatusChoices.Occupied:
      return { label: 'Occupied', variant: 'occupied' };
    case BedStatusChoices.Reserved:
      return { label: 'Reserved', variant: 'reserved' };
    case BedStatusChoices.InTurnaround:
      return { label: 'Turnaround', variant: 'turnaround' };
    case BedStatusChoices.OutOfService:
      return { label: 'Out of Service', variant: 'out-of-service' };
    default:
      return { label: 'Unknown', variant: 'unknown' };
  }
}

export function BedTable({
  beds,
  getRowKey,
  onRowClick,
  onClone,
  onEdit,
  onDeleteBeds,
  onMarkReady,
  onReserve,
  loading,
  loadingState,
  emptyState = tableEmptyState('No beds yet.'),
  wrapperClassName,
  headerClassName,
  headerInsetClassName,
  rowClassName,
  rowInsetClassName,
  tableStyle,
  headerStyle,
  rowStyle,
}: BedTableProps) {
  const columns: TableColumn<Bed>[] = useMemo(
    () => [
      {
        key: 'bedId',
        label: 'Bed',
        width: '1.1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (bed) => bed.name ?? `Bed #${bed.id}`,
        sortValue: (bed) => bed.name ?? `Bed #${bed.id}`,
        filterValue: (bed) => bed.name ?? `Bed #${bed.id}`,
      },
      {
        key: 'status',
        label: 'Status',
        width: 'minmax(140px, 1fr)',
        render: (bed) => {
          const info = bedStatusInfo(bed.status, bed.maintenanceFlag);
          return <StatusBadge label={info.label} variant={info.variant} />;
        },
        sortValue: (bed) =>
          bedStatusInfo(bed.status, bed.maintenanceFlag).label,
        filterValue: (bed) =>
          bedStatusInfo(bed.status, bed.maintenanceFlag).label,
        autoFilterOptions: true,
      },
      {
        key: 'room',
        label: 'Room Assignment',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (bed) => bed.room?.name ?? '—',
        sortValue: (bed) => bed.room?.name ?? '',
      },
    ],
    [],
  );

  return (
    <Table<Bed>
      columns={columns}
      rows={beds}
      getRowKey={getRowKey ?? ((bed) => bed.id)}
      getRowSlot={(bed) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Bed actions"
        >
          {bed.status === BedStatusChoices.InTurnaround && (
            <Button
              type="button"
              variant="confirm"
              aria-label="Mark ready"
              onClick={() => onMarkReady(bed.id)}
            />
          )}
          {bed.status === BedStatusChoices.Available && (
            <Button
              type="button"
              variant="edit"
              aria-label="Reserve bed"
              leftIcon={<BookCheck size={22} stroke="black" />}
              onClick={() => onReserve(bed)}
            />
          )}
          <Button
            type="button"
            variant="edit"
            aria-label="Clone bed"
            leftIcon={<CopyPlus size={22} stroke="black" />}
            onClick={() => onClone(bed.id)}
          />
          <Button
            type="button"
            variant="edit"
            aria-label="Edit bed"
            onClick={() => onEdit(bed.id)}
          />
          <Button
            type="button"
            variant="trash"
            aria-label="Delete bed"
            onClick={() => onDeleteBeds([bed.id])}
          />
        </div>
      )}
      trailingColumnWidth="140px"
      onRowClick={onRowClick}
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
