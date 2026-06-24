import { mergeCss } from '@monorepo/react/shared';
import { CopyPlus, Minus, Trash2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from './base-ui/buttons/buttons';
import { ConfirmationModal } from './base-ui/modal/ConfirmationModal';
import { Table, type TableColumn } from './base-ui/table';
import { Text } from './base-ui/text/text';

// REPLACE WITH ACTUAL QUERIED DATA
import {
  RoomStatusChoices,
  type RoomType,
} from '../apollo/graphql/__generated__/types';

export type Room = RoomType;

export type RoomRowObject = {
  id: string;
  room: Room;
};

type RoomTableProps = {
  rows: Room[];
  getRowKey?: (item: Room, index: number) => string;
  onRowClick?: (rowObject: RoomRowObject, rowIndex: number) => void;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  tableStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  rowStyle?: CSSProperties;
  onClone?: (rowObject: RoomRowObject) => void;
  onDeleteRooms?: (roomIds: string[]) => void;
};

// TODO: Create Tag Components in Base UI -----------------
const STATUS_STYLE: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'bg-[#D7F5DF]',
  [RoomStatusChoices.NeedsMaintenance]: 'bg-[#FFE5E0]',
  [RoomStatusChoices.Reserved]: 'bg-[#FFEBCB]',
};

const STATUS_TEXT_STYLE: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'text-[#0F8F2F] font-medium',
  [RoomStatusChoices.NeedsMaintenance]: 'text-[#D7332A] font-medium',
  [RoomStatusChoices.Reserved]: 'text-[#CC6F00] font-medium',
};

const STATUS_LABEL: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'Available',
  [RoomStatusChoices.NeedsMaintenance]: 'Out of Service',
  [RoomStatusChoices.Reserved]: 'Reserved',
};
// ------------------------------------------

export function RoomTable({
  rows,
  getRowKey,
  onRowClick,
  loading,
  loadingState,
  emptyState,
  wrapperClassName,
  headerClassName,
  rowClassName,
  tableStyle,
  headerStyle,
  rowStyle,
  onClone,
  onDeleteRooms,
}: RoomTableProps) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    roomIds: string[];
    roomName?: string;
  }>({ isOpen: false, roomIds: [] });

  useEffect(() => {
    const validIds = new Set(rows.map((room) => room.id));
    setSelectedRoomIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [rows]);

  const toggleRowSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ isOpen: false, roomIds: [] });
  };

  const selectedCount = selectedRoomIds.length;

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    setDeleteConfirmation({
      isOpen: true,
      roomIds: selectedRoomIds,
    });
  };

  const deleteConfirmationTitle = deleteConfirmation.roomName
    ? `Are you sure you want to delete ${deleteConfirmation.roomName}?`
    : deleteConfirmation.roomIds.length === 1
    ? 'Are you sure you want to delete the selected room?'
    : `Are you sure you want to delete the ${deleteConfirmation.roomIds.length} selected rooms?`;

  const columns: TableColumn<Room>[] = useMemo(
    () => [
      {
        key: 'selected',
        label: '',
        width: '2rem',
        render: (room) => {
          const isSelected = selectedRoomIds.includes(room.id);

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
      {
        key: 'name',
        label: 'Room Name',
        width: '1.5fr',
        render: (room) => (
          <Text variant="body" className="text-black">
            {room.name}
          </Text>
        ),
        sortValue: (room) => room.name,
        filterValue: (room) => room.name,
      },
      {
        key: 'status',
        label: 'Status',
        width: '1.5fr',
        render: (room) => (
          <span
            className={mergeCss([
              'inline-flex rounded-full px-3 py-1 leading-none',
              STATUS_STYLE[room.status ?? RoomStatusChoices.Available],
            ])}
          >
            <Text
              variant="tag-sm"
              className={
                STATUS_TEXT_STYLE[room.status ?? RoomStatusChoices.Available]
              }
            >
              {STATUS_LABEL[room.status ?? RoomStatusChoices.Available]}
            </Text>
          </span>
        ),
        sortValue: (room) => STATUS_LABEL[room.status ?? RoomStatusChoices.Available],
        filterValue: (room) => STATUS_LABEL[room.status ?? RoomStatusChoices.Available],
        autoFilterOptions: true,
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '1.5fr',
        render: (room) => (
          <div className="flex flex-wrap items-center gap-2">
            {(room.amenities
              ? room.amenities
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : []
            )
              .slice(0, 2)
              .map((tag) => (
                <div key={tag} className="rounded-full bg-[#EDEFF5] px-3 py-1">
                  <Text variant="tag-sm" className="text-[#747A82]">
                    {tag}
                  </Text>
                </div>
              ))}
            {(room.amenities
              ? room.amenities
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : []
            ).length > 2 && (
              <div className="rounded-full bg-[#EDEFF5] px-3 py-1">
                <Text variant="tag-sm" className="text-[#747A82]">
                  +
                  {(room.amenities
                    ? room.amenities
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : []
                  ).length - 2}
                </Text>
              </div>
            )}
          </div>
        ),
      },
    ],
    [selectedRoomIds]
  );

  return (
    <div className="relative flex flex-col">
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
          <span className="text-sm text-[#747A82]">
            {selectedCount} {selectedCount === 1 ? 'room' : 'rooms'} selected
          </span>
          <Button
            variant="primary"
            leftIcon={<Trash2 size={20} />}
            rightIcon={false}
            onClick={handleDeleteSelected}
            color="red"
          >
            Delete
          </Button>
        </div>
      )}
      <Table<Room, RoomRowObject>
        columns={columns}
        rows={rows}
        getRowKey={getRowKey ?? ((room) => room.id)}
        getRowObject={(room) => ({ id: room.id, room })}
        getRowSlot={(rowObject) => (
          <div className="flex items-center gap-1">
            <Button
              variant="edit"
              className="text-[#747A82]"
              aria-label="Clone room"
              leftIcon={<CopyPlus size={22} stroke="black" />}
              onClick={(e) => {
                e.stopPropagation();
                onClone?.(rowObject);
              }}
            />
            <Button
              variant="edit"
              className="text-[#747A82]"
              onClick={(e) => {
                e.stopPropagation();
                onRowClick?.(rowObject, 0);
              }}
            />
            <Button
              variant="trash"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmation({
                  isOpen: true,
                  roomIds: [rowObject.id],
                  roomName: rowObject.room.name,
                });
              }}
            />
          </div>
        )}
        trailingColumnWidth="128px"
        loading={loading}
        loadingState={loadingState}
        emptyState={emptyState}
        wrapperClassName={wrapperClassName}
        headerClassName={headerClassName}
        rowClassName={rowClassName}
        tableStyle={tableStyle}
        headerStyle={headerStyle}
        rowStyle={rowStyle}
      />
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        variant="danger"
        title={deleteConfirmationTitle}
        description="This action cannot be undone."
        primaryAction={{
          label: 'Delete',
          onClick: () => {
            if (deleteConfirmation.roomIds.length > 0) {
              onDeleteRooms?.(deleteConfirmation.roomIds);
              setSelectedRoomIds([]);
            }
            closeDeleteConfirmation();
          },
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeDeleteConfirmation,
        }}
      />
    </div>
  );
}
