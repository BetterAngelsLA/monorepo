import { Filter, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BedRoomForList, BedRowObject } from '../types/bed';
import { BedTable } from './BedTable';
import { Button } from './base-ui/buttons';

const SEARCH_DEBOUNCE_MS = 300;

type BedListViewProps = {
  rooms: BedRoomForList[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRowClick?: (rowObject: BedRowObject, rowIndex: number) => void;
  selectedBedIds?: string[];
  onSelectedBedIdsChange?: (ids: string[]) => void;
  onDuplicate?: (rowObject: BedRowObject, rowIndex: number) => void;
  onEdit?: (rowObject: BedRowObject, rowIndex: number) => void;
  onDelete?: (rowObject: BedRowObject, rowIndex: number) => void;
  onDeleteSelected?: (bedIds: string[]) => void;
  onCreateBed?: () => void;
  onFilterClick?: () => void;
  onSortClick?: () => void;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  showCreateFab?: boolean;
};

export function BedListView({
  rooms,
  searchPlaceholder = 'Search rooms',
  searchValue: searchValueProp,
  onSearchChange,
  onRowClick,
  selectedBedIds,
  onSelectedBedIdsChange,
  onDuplicate,
  onEdit,
  onDelete,
  onDeleteSelected,
  onCreateBed,
  onFilterClick,
  onSortClick,
  loading,
  loadingState,
  emptyState,
  showCreateFab = true,
}: BedListViewProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const isControlled = searchValueProp !== undefined;
  const searchInput = isControlled ? searchValueProp : internalSearch;

  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    if (!isControlled) setInternalSearch(value);
    onSearchChange?.(value);
  };

  const filteredRooms = useMemo(
    () => filterRoomsBySearch(rooms, debouncedSearch),
    [rooms, debouncedSearch]
  );

  const selectedCount = selectedBedIds?.length ?? 0;
  const showBulkDelete = Boolean(onDeleteSelected) && selectedCount >= 2;

  return (
    <>
      <div className="flex flex-col mx-4">
        <form
          className="my-1 flex w-full flex-wrap items-center gap-3 bg-white px-3"
          style={{ fontFamily: 'Poppins, sans-serif' }}
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex h-11 w-full max-w-[380px] items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2">
            <span className="flex h-8 w-9 items-center justify-center rounded-full bg-[#FCF500] text-[#1E3342]">
              <Search size={20} />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-full w-full rounded-full bg-transparent pr-3 text-base text-[#4A4F57] outline-none transition-colors placeholder:text-[#7A818A]"
            />
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {showBulkDelete && (
              <Button
                type="button"
                variant="primary"
                className="border-red-200 text-[#CB0808] hover:bg-red-50"
                leftIcon={<Trash2 size={20} color="currentColor" />}
                rightIcon={false}
                onClick={() => onDeleteSelected?.(selectedBedIds ?? [])}
              >
                Delete All
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              leftIcon={<Filter size={20} />}
              rightIcon={false}
              onClick={onFilterClick}
            >
              Filter
            </Button>

            <Button
              type="button"
              variant="primary"
              leftIcon={<Settings2 size={20} />}
              rightIcon={false}
              onClick={onSortClick}
            >
              Sort
            </Button>
          </div>
        </form>

        <BedTable
          rooms={filteredRooms}
          onRowClick={onRowClick}
          selectedBedIds={selectedBedIds}
          onSelectedBedIdsChange={onSelectedBedIdsChange}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onDelete={onDelete}
          loading={loading}
          loadingState={loadingState}
          emptyState={emptyState}
          headerStyle={{ fontFamily: 'Poppins, sans-serif' }}
          rowStyle={{ fontFamily: 'Poppins, sans-serif' }}
        />
      </div>

      {showCreateFab && onCreateBed && (
        <div className="fixed bottom-6 right-6 z-20 text-sm">
          <Button
            type="button"
            variant="floating"
            color="blue"
            leftIcon={<Plus size={22} stroke="white" />}
            rightIcon={false}
            onClick={onCreateBed}
          >
            Create Bed
          </Button>
        </div>
      )}
    </>
  );
}

function filterRoomsBySearch(
  rooms: BedRoomForList[],
  q: string
): BedRoomForList[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rooms;

  return rooms
    .map((room) => {
      const roomMatches = room.roomLabel.toLowerCase().includes(needle);
      const beds = room.beds.filter(
        (b) =>
          roomMatches ||
          b.bedName.toLowerCase().includes(needle) ||
          (b.tags ?? []).some((t) => t.toLowerCase().includes(needle))
      );
      return { ...room, beds };
    })
    .filter((room) => room.beds.length > 0);
}
