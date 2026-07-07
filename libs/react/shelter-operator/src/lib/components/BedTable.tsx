import { mergeCss } from '@monorepo/react/shared';
import { BookCheck, CopyPlus, Minus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import {
  BedStatusChoices,
  type BedType,
} from '../apollo/graphql/__generated__/types';
import { Button } from './base-ui/buttons';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from './base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from './base-ui/table';

export type Bed = BedType & {
  roomId: string;
  roomAssignment: string;
};

export type BedRowObject = {
  id: string;
  bed: Bed;
  roomId: string;
  roomAssignment: string;
};

function isBedAvailable(status: BedStatusChoices | null | undefined): boolean {
  return status === BedStatusChoices.Available;
}

function bedStatusInfo(
  status: BedStatusChoices | null | undefined,
  maintenanceFlag?: boolean
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

type BedTableProps = {
  beds: Bed[];
  getRowKey?: (bed: Bed, index: number) => string;
  onRowClick?: (rowObject: BedRowObject, rowIndex: number) => void;
  selectedBedIds?: string[];
  onSelectedBedIdsChange?: (ids: string[]) => void;
  onClone?: (rowObject: BedRowObject) => void;
  onEdit?: (rowObject: BedRowObject) => void;
  onDeleteBeds?: (bedIds: string[]) => void;
  onMarkReady?: (rowObject: BedRowObject) => void;
  onReserve?: (rowObject: BedRowObject) => void;
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

export function BedTable({
  beds,
  getRowKey,
  onRowClick,
  selectedBedIds,
  onSelectedBedIdsChange,
  onClone,
  onEdit,
  onDeleteBeds,
  onMarkReady,
  onReserve,
  loading,
  loadingState,
  emptyState,
  wrapperClassName,
  headerClassName,
  headerInsetClassName,
  rowClassName,
  rowInsetClassName,
  tableStyle,
  headerStyle,
  rowStyle,
}: BedTableProps) {
  const selectedSet = useMemo(
    () => new Set(selectedBedIds ?? []),
    [selectedBedIds]
  );

  const toggleRowSelection = useCallback(
    (bedId: string) => {
      if (!onSelectedBedIdsChange) return;
      const next = new Set(selectedSet);
      if (next.has(bedId)) {
        next.delete(bedId);
      } else {
        next.add(bedId);
      }
      onSelectedBedIdsChange([...next]);
    },
    [onSelectedBedIdsChange, selectedSet]
  );

  const showCheckboxColumn = !!onSelectedBedIdsChange;

  const columns: TableColumn<Bed>[] = useMemo(
    () => [
      ...(showCheckboxColumn
        ? [
            {
              key: 'selected' as const,
              label: '',
              width: '2rem',
              render: (bed: Bed) => {
                const isSelected = selectedSet.has(bed.id);
                return (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={isSelected ? 'Deselect bed' : 'Select bed'}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRowSelection(bed.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleRowSelection(bed.id);
                      }
                    }}
                    className={mergeCss([
                      'inline-flex size-5 items-center justify-center rounded border transition-colors',
                      isSelected
                        ? 'border-[#4A90E2] bg-[#4A90E2] text-white'
                        : 'border-[#808080] bg-white text-transparent hover:border-[#4A90E2]',
                    ])}
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                );
              },
            },
          ]
        : []),
      {
        key: 'bedId',
        label: 'Bed',
        width: '1.1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (bed) => bed.name ?? bed.id,
        sortValue: (bed) => bed.name ?? bed.id,
        filterValue: (bed) => bed.name ?? bed.id,
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
        render: (bed) => bed.roomAssignment || '—',
        sortValue: (bed) => bed.roomAssignment || '',
      },
    ],
    [selectedSet, toggleRowSelection, showCheckboxColumn]
  );

  return (
    <Table<Bed, BedRowObject>
      columns={columns}
      rows={beds}
      getRowKey={getRowKey ?? ((bed) => bed.id)}
      getRowObject={(bed) => ({
        id: bed.id,
        bed,
        roomId: bed.roomId,
        roomAssignment: bed.roomAssignment,
      })}
      getRowSlot={(rowObject) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Bed actions"
        >
          {rowObject.bed.status === BedStatusChoices.InTurnaround &&
            onMarkReady && (
              <Button
                type="button"
                variant="confirm"
                aria-label="Mark ready"
                onClick={() => onMarkReady(rowObject)}
              />
            )}
          {onReserve && (
            <Button
              type="button"
              variant="edit"
              aria-label="Reserve bed"
              disabled={!isBedAvailable(rowObject.bed.status)}
              leftIcon={
                <BookCheck
                  size={22}
                  stroke={
                    !isBedAvailable(rowObject.bed.status) ? 'gray' : 'black'
                  }
                />
              }
              onClick={() => onReserve(rowObject)}
            />
          )}
          {onClone && (
            <Button
              type="button"
              variant="edit"
              aria-label="Clone bed"
              leftIcon={<CopyPlus size={22} stroke="black" />}
              onClick={() => onClone(rowObject)}
            />
          )}
          {onEdit && (
            <Button
              type="button"
              variant="edit"
              aria-label="Edit bed"
              onClick={() => onEdit(rowObject)}
            />
          )}
          {onDeleteBeds && (
            <Button
              type="button"
              variant="trash"
              aria-label="Delete bed"
              onClick={() => onDeleteBeds([rowObject.id])}
            />
          )}
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
