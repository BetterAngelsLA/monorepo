import { RoomStatusChoices } from '@monorepo/ba-platform/types';
import { BookCheck, CopyPlus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { Button } from './base-ui/buttons';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from './base-ui/status-badge/StatusBadge';
import { Table, type TableColumn } from './base-ui/table';

export type Room = {
  id: string;
  name: string;
  status: RoomStatusChoices;
};

type RoomTableProps = {
  rooms: Room[];
  getRowKey?: (item: Room, index: number) => string;
  onRowClick?: (room: Room, rowIndex: number) => void;
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
  onEdit?: (room: Room) => void;
  onClone?: (room: Room) => void;
  onDeleteRooms?: (roomIds: string[], roomName?: string) => void;
  onMarkReady?: (room: Room) => void;
  onReserve?: (room: Room) => void;
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
  rooms,
  getRowKey,
  onRowClick,
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
  onEdit,
  onClone,
  onDeleteRooms,
  onMarkReady,
  onReserve,
}: RoomTableProps) {
  const columns: TableColumn<Room>[] = useMemo(
    () => [
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
    [],
  );

  return (
    <Table<Room>
      columns={columns}
      rows={rooms}
      getRowKey={getRowKey ?? ((room) => room.id)}
      getRowSlot={(room) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Room actions"
        >
          {room.status === RoomStatusChoices.InTurnaround && onMarkReady && (
            <Button
              type="button"
              variant="confirm"
              aria-label="Mark ready"
              onClick={() => onMarkReady(room)}
            />
          )}
          {room.status === RoomStatusChoices.Available && onReserve && (
            <Button
              type="button"
              variant="edit"
              aria-label="Reserve room"
              leftIcon={<BookCheck size={22} stroke="black" />}
              onClick={() => onReserve(room)}
            />
          )}
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            aria-label="Clone room"
            leftIcon={<CopyPlus size={22} stroke="black" />}
            onClick={() => onClone?.(room)}
          />
          <Button
            type="button"
            variant="edit"
            className="text-[#747A82]"
            onClick={() => onEdit?.(room)}
          />
          <Button
            type="button"
            variant="trash"
            onClick={() => onDeleteRooms?.([room.id], room.name)}
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
