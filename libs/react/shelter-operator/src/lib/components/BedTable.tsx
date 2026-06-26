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

export type BedRoomForList = {
  id: string;
  roomLabel: string;
  beds: BedType[];
};

export type BedRowObject = {
  bedId: string;
  name: string;
  status?: BedType['status'];
  roomId: string;
  roomAssignment: string;
};

type FlatBedRow = {
  bed: BedType;
  roomId: string;
  roomAssignment: string;
};

function isBedAvailable(status: BedStatusChoices | null | undefined): boolean {
  return status === BedStatusChoices.Available;
}

function flattenRooms(rooms: BedRoomForList[]): FlatBedRow[] {
  const out: FlatBedRow[] = [];
  for (const room of rooms) {
    for (const bed of room.beds) {
      out.push({
        bed,
        roomId: room.id,
        roomAssignment: room.roomLabel,
      });
    }
  }
  return out;
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
  rooms: BedRoomForList[];
  getRowKey?: (item: FlatBedRow, index: number) => string;
  onRowClick?: (rowObject: BedRowObject, rowIndex: number) => void;
  selectedBedIds?: string[];
  onSelectedBedIdsChange?: (ids: string[]) => void;
  onClone?: (rowObject: BedRowObject, rowIndex: number) => void;
  onEdit?: (rowObject: BedRowObject, rowIndex: number) => void;
  onDeleteBeds?: (bedIds: string[]) => void;
  onMarkReady?: (rowObject: BedRowObject, rowIndex: number) => void;
  onReserve?: (rowObject: BedRowObject, rowIndex: number) => void;
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
  trailingColumnWidth?: string;
};

function toRowObject(
  bed: BedType,
  roomId: string,
  roomAssignment: string
): BedRowObject {
  return {
    bedId: bed.id,
    name: bed.name ?? '',
    status: bed.status,
    roomId,
    roomAssignment,
  };
}

export function BedTable({
  rooms,
  getRowKey: getRowKeyFlat,
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
  trailingColumnWidth = '140px',
}: BedTableProps) {
  const flatBedRows = useMemo(() => flattenRooms(rooms), [rooms]);

  const selectedSet = useMemo(
    () => new Set(selectedBedIds ?? []),
    [selectedBedIds]
  );

  const toggleOne = useCallback(
    (bedId: string, checked: boolean) => {
      if (!onSelectedBedIdsChange) return;
      const next = new Set(selectedSet);
      if (checked) next.add(bedId);
      else next.delete(bedId);
      onSelectedBedIdsChange([...next]);
    },
    [onSelectedBedIdsChange, selectedSet]
  );

  const hasActionSlot = !!(
    onClone ||
    onDeleteBeds ||
    onEdit ||
    onMarkReady ||
    onReserve
  );
  const showCheckboxColumn = !!onSelectedBedIdsChange;

  const defaultColumns: TableColumn<FlatBedRow>[] = useMemo(() => {
    const selectionColumn: TableColumn<FlatBedRow> = {
      key: 'select',
      label: <span className="sr-only">Select row</span>,
      width: '52px',
      headerClassName: 'justify-self-start',
      cellClassName: 'justify-self-start',
      render: ({ bed }) => {
        const selected = selectedSet.has(bed.id);
        return (
          <span
            className="inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={selected}
                onChange={(e) => toggleOne(bed.id, e.target.checked)}
                aria-label={`Select ${bed.name}`}
              />
              <span
                className={mergeCss([
                  'inline-flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white',
                  'peer-checked:border-[#008CEE] peer-checked:bg-[#008CEE]',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-[#008CEE] peer-focus-visible:ring-offset-1',
                  'peer-checked:[&_.bed-row-select-minus]:opacity-100',
                ])}
              >
                <Minus
                  className="bed-row-select-minus opacity-0 text-white"
                  size={12}
                  strokeWidth={2.5}
                  aria-hidden
                />
              </span>
            </label>
          </span>
        );
      },
    };

    return [
      ...(showCheckboxColumn ? [selectionColumn] : []),
      {
        key: 'bedId',
        label: 'Bed',
        width: '1.1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: ({ bed }) => bed.name || bed.id,
        sortValue: ({ bed }) => bed.name || bed.id,
        filterValue: ({ bed }) => bed.name || bed.id,
      },
      {
        key: 'status',
        label: 'Status',
        width: 'minmax(140px, 1fr)',
        render: ({ bed }) => {
          const info = bedStatusInfo(bed.status, bed.maintenanceFlag);
          return <StatusBadge label={info.label} variant={info.variant} />;
        },
        sortValue: ({ bed }) =>
          bedStatusInfo(bed.status, bed.maintenanceFlag).label,
        filterValue: ({ bed }) =>
          bedStatusInfo(bed.status, bed.maintenanceFlag).label,
        autoFilterOptions: true,
      },
      {
        key: 'room',
        label: 'Room Assignment',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: ({ roomAssignment }) => roomAssignment || '—',
        sortValue: ({ roomAssignment }) => roomAssignment || '',
      },
    ];
  }, [showCheckboxColumn, selectedSet, toggleOne]);

  return (
    <Table<FlatBedRow, BedRowObject>
      columns={defaultColumns}
      rows={flatBedRows}
      labelClassName="text-lg"
      getRowKey={getRowKeyFlat ?? ((row) => row.bed.id)}
      getRowObject={(row) =>
        toRowObject(row.bed, row.roomId, row.roomAssignment)
      }
      getRowSlot={
        hasActionSlot
          ? (rowObject, _item, rowIndex) => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
                role="group"
                aria-label="Bed actions"
              >
                {rowObject.status === BedStatusChoices.InTurnaround &&
                  onMarkReady && (
                    <Button
                      type="button"
                      variant="confirm"
                      aria-label="Mark ready"
                      onClick={() => onMarkReady(rowObject, rowIndex)}
                    />
                  )}
                {onReserve && (
                  <Button
                    type="button"
                    variant="edit"
                    aria-label="Reserve bed"
                    disabled={!isBedAvailable(rowObject.status)}
                    leftIcon={
                      <BookCheck
                        size={22}
                        stroke={
                          !isBedAvailable(rowObject.status) ? 'gray' : 'black'
                        }
                      />
                    }
                    onClick={() => onReserve(rowObject, rowIndex)}
                  />
                )}
                {onClone && (
                  <Button
                    type="button"
                    variant="edit"
                    aria-label="Clone bed"
                    leftIcon={<CopyPlus size={22} stroke="black" />}
                    onClick={() => onClone(rowObject, rowIndex)}
                  />
                )}
                {onEdit && (
                  <Button
                    type="button"
                    variant="edit"
                    aria-label="Edit bed"
                    onClick={() => onEdit(rowObject, rowIndex)}
                  />
                )}
                {onDeleteBeds && (
                  <Button
                    type="button"
                    variant="trash"
                    aria-label="Delete bed"
                    onClick={() => onDeleteBeds([rowObject.bedId])}
                  />
                )}
              </div>
            )
          : undefined
      }
      trailingColumnWidth={hasActionSlot ? trailingColumnWidth : undefined}
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
