import { mergeCss } from '@monorepo/react/shared';
import { BookCheck, CopyPlus, Minus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { Button } from './base-ui/buttons';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from './base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from './base-ui/table';

import {
  RoomStatusChoices,
  type RoomType,
} from '@monorepo/ba-platform/types';

export type Room = RoomType;

export type RoomRowObject = {
  id: string;
  room: Room;
};

type RoomTableProps = {
  rows: Room[];
  getRowKey?: (item: Room, index: number) => string;
  onRowClick?: (rowObject: RoomRowObject, rowIndex: number) => void;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
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
  onClone?: (rowObject: RoomRowObject) => void;
  onDeleteRooms?: (roomIds: string[]) => void;
  onReserve?: (rowObject: RoomRowObject) => void;
};

function roomStatusInfo(status: RoomStatusChoices | null | undefined): {
  label: string;
  variant: StatusBadgeVariant;
} {
  switch (status) {
    case RoomStatusChoices.Available:
      return { label: 'Available', variant: 'available' };
    case RoomStatusChoices.Occupied:
      return { label: 'Occupied', variant: 'occupied' };
    case RoomStatusChoices.Reserved:
      return { label: 'Reserved', variant: 'reserved' };
    case RoomStatusChoices.InTurnaround:
      return { label: 'In Turnaround', variant: 'turnaround' };
    case RoomStatusChoices.OutOfService:
      return { label: 'Out of Service', variant: 'out-of-service' };
    default:
      return { label: 'Unknown', variant: 'unknown' };
  }
}

export function RoomTable({
  rows,
  getRowKey,
  onRowClick,
  selectedIds,
  onSelectedIdsChange,
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
  onClone,
  onDeleteRooms,
  onReserve,
}: RoomTableProps) {
  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  const toggleRowSelection = useCallback(
    (roomId: string) => {
      if (!onSelectedIdsChange) return;
      const next = new Set(selectedSet);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      onSelectedIdsChange([...next]);
    },
    [onSelectedIdsChange, selectedSet]
  );

  const showCheckboxColumn = !!onSelectedIdsChange;

  const columns: TableColumn<Room>[] = useMemo(
    () => [
      ...(showCheckboxColumn
        ? [
            {
              key: 'selected' as const,
              label: '',
              width: '2rem',
              render: (room: Room) => {
                const isSelected = selectedSet.has(room.id);
                return (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={isSelected ? 'Deselect room' : 'Select room'}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRowSelection(room.id);
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
        key: 'name',
        label: 'Room',
        width: '1.5fr',
        render: (room) => <span className="text-black">{room.name}</span>,
        sortValue: (room) => room.name,
        filterValue: (room) => room.name,
      },
      {
        key: 'status',
        label: 'Status',
        width: '1.5fr',
        render: (room) => {
          const info = roomStatusInfo(room.status);
          return <StatusBadge label={info.label} variant={info.variant} />;
        },
        sortValue: (room) => roomStatusInfo(room.status).label,
        filterValue: (room) => roomStatusInfo(room.status).label,
        autoFilterOptions: true,
      },
    ],
    [selectedSet, toggleRowSelection, showCheckboxColumn]
  );

  return (
    <Table<Room, RoomRowObject>
      columns={columns}
      rows={rows}
      getRowKey={getRowKey ?? ((room) => room.id)}
      getRowObject={(room) => ({ id: room.id, room })}
      getRowSlot={(rowObject) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Room actions"
        >
          {onReserve && (
            <Button
              type="button"
              variant="edit"
              className="text-[#747A82]"
              aria-label="Reserve room"
              leftIcon={<BookCheck size={22} stroke="black" />}
              onClick={() => onReserve(rowObject)}
            />
          )}
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            aria-label="Clone room"
            leftIcon={<CopyPlus size={22} stroke="black" />}
            onClick={() => onClone?.(rowObject)}
          />
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            onClick={() => onRowClick?.(rowObject, 0)}
          />
          <Button
            type="button"
            variant="trash"
            onClick={() => onDeleteRooms?.([rowObject.id])}
          />
        </div>
      )}
      trailingColumnWidth="140px"
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
