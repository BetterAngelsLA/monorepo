import { CopyPlus, Filter, Search, Settings2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from './base-ui/buttons';
import { Table, type TableColumn } from './Table';

// REPLACE WITH ACTUAL QUERIED DATA
export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'out-of-service'
  | 'reserved';

export type Room = {
  id: string;
  name: string;
  status: RoomStatus;
  tags: string[];
};

export type RoomRowObject = {
  id: string;
  room: Room;
};

type RoomTableProps = {
  rows: Room[];
  getRowKey?: (item: Room, index: number) => string;
  onRowClick?: (rowObject: RoomRowObject, rowIndex: number) => void;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  tableStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  rowStyle?: CSSProperties;
  onCreateRoom?: () => void;
};

// TODO: Create Tag Components in Base UI -----------------
const STATUS_STYLE: Record<RoomStatus, string> = {
  available: 'bg-[#D7F5DF] text-[#13A538]',
  occupied: 'bg-[#DCEEFF] text-[#2583E8]',
  'out-of-service': 'bg-[#FFE5E0] text-[#EF3D26]',
  reserved: 'bg-[#FFEBCB] text-[#F08C00]',
};

const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  'out-of-service': 'Out of Service',
  reserved: 'Reserved',
};
// ------------------------------------------

export function RoomTable({
  rows,
  getRowKey,
  onRowClick,
  onSearchChange,
  searchPlaceholder = 'Search rooms',
  loading,
  loadingState,
  emptyState,
  wrapperClassName,
  headerClassName,
  rowClassName,
  tableStyle,
  headerStyle,
  rowStyle,
}: RoomTableProps) {
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    onSearchChange?.(searchInput);
  }, [onSearchChange, searchInput]);

  const columns: TableColumn<Room>[] = useMemo(
    () => [
      {
        key: 'selected',
        label: '',
        width: '2rem',
        render: () => (
          // EDIT Checkbox to be - instead of check
          <input
            type="checkbox"
            aria-label="Select room"
            onClick={(event) => event.stopPropagation()}
            className="size-4 accent-[#008CEE]"
          />
        ),
      },
      {
        key: 'name',
        label: 'Room Name',
        width: '1.5fr',
        cellClassName: 'text-[#111827] font-medium',
        render: (room) => room.name,
      },
      {
        key: 'status',
        label: 'Status',
        width: '1.5fr',
        render: (room) => (
          <span
            className={[
              'inline-flex rounded-full px-3 py-1 text-sm leading-none',
              STATUS_STYLE[room.status],
            ].join(' ')}
          >
            {STATUS_LABEL[room.status]}
          </span>
        ),
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '1.5fr',
        render: (room) => (
          <div className="flex flex-wrap items-center gap-2">
            {room.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]"
              >
                {tag}
              </span>
            ))}
            {room.tags.length > 2 && (
              <span className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]">
                +{room.tags.length - 2}
              </span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // local filtering that allows for filtering by name or status on hard coded data
  const filteredRows = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((room) => {
      const normalizedStatus = STATUS_LABEL[room.status].toLowerCase();
      const matchesName = room.name.toLowerCase().includes(query);
      const matchesStatus = normalizedStatus.includes(query);
      const matchesTags = room.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      );

      return matchesName || matchesStatus || matchesTags;
    });
  }, [rows, searchInput]);

  return (
    <div className="relative flex flex-col">
      <form
        className="mt-8 flex w-full px-4 flex-wrap items-center bg-white"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex h-11 w-full max-w-[380px] items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2">
          <span className="flex h-8 w-9 items-center justify-center rounded-full bg-[#FCF500] text-[#1E3342]">
            <Search size={20} />
          </span>
          {/* Search Bar should filter out values on change */}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-full w-full rounded-full bg-transparent pr-3 text-base text-[#4A4F57] outline-none transition-colors placeholder:text-[#7A818A]"
          />
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Filter size={20} />}
            rightIcon={false}
          >
            Filter
          </Button>
          <Button
            variant="primary"
            leftIcon={<Settings2 size={20} />}
            rightIcon={false}
          >
            Sort
          </Button>
        </div>
      </form>

      <Table<Room, RoomRowObject>
        columns={columns}
        rows={filteredRows}
        getRowKey={getRowKey ?? ((room) => room.id)}
        getRowObject={(room) => ({ id: room.id, room })}
        getTrailingContent={() => (
          <div className="flex items-center gap-1">
            <Button variant="edit" />
            <Button variant="edit" leftIcon={<CopyPlus />} />
            <Button variant="trash" />
          </div>
        )}
        trailingColumnWidth="128px"
        headerInsetClassName="px-0 py-2 pt-6"
        rowInsetClassName="px-0 mx-0 py-2"
        onRowClick={onRowClick}
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
    </div>
  );
}
