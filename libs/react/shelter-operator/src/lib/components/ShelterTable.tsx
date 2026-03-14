import { Filter, Search, Settings2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Shelter } from '../types/shelter';
import { Button } from './base-ui/buttons';
import { Table, type TableColumn } from './Table';

export type ShelterRowObject = {
  id: string;
  shelter: Shelter;
  name: string;
  address: string;
  totalBeds: number;
  reservedBeds: number;
  tags: string[];
};

type ShelterTableProps = {
  rows: Shelter[];
  getRowKey?: (item: Shelter, index: number) => string;
  onRowClick?: (rowObject: ShelterRowObject, rowIndex: number) => void;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  tableStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  rowStyle?: CSSProperties;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

const MAX_VISIBLE_TAG_CHAR_COUNT = 15;

function renderTags(tags: string[] | null) {
  const validTags = (tags ?? []).filter((tag) => Boolean(tag?.trim()));
  const hardcodedTags = ['Women Only', 'Shared', 'Pets Allowed', 'No Parking'];
  const tagsToShow = validTags.length > 0 ? validTags : hardcodedTags;

  let visibleCharCount = 0;
  const visibleTags = tagsToShow.filter((tag) => {
    const nextCount = visibleCharCount + tag.length;
    if (nextCount >= MAX_VISIBLE_TAG_CHAR_COUNT) return false;
    visibleCharCount = nextCount;
    return true;
  });

  const remainingTagsCount = Math.max(
    tagsToShow.length - visibleTags.length,
    0
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]"
        >
          {tag}
        </span>
      ))}
      {remainingTagsCount > 0 && (
        <span className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]">
          +{remainingTagsCount}
        </span>
      )}
    </div>
  );
}

export function ShelterTable({
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
  onSearchChange,
  searchPlaceholder = 'Search shelters',
}: ShelterTableProps) {
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    onSearchChange?.(searchInput);
  }, [onSearchChange, searchInput]);

  const columns: TableColumn<Shelter>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Shelter Name',
        width: '1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.name ?? 'N/A',
      },
      {
        key: 'address',
        label: 'Address',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.address ?? 'N/A',
      },
      {
        key: 'capacity',
        label: 'Capacity',
        width: '1.2fr',
        cellClassName: 'whitespace-nowrap text-gray-700',
        render: (shelter) => {
          const totalBeds = shelter.totalBeds ?? 0;
          const hasCapacity = totalBeds > 0;
          const reservedBeds = hasCapacity
            ? Math.min(
                Math.max(shelter.occupiedBeds ?? totalBeds, 0),
                totalBeds
              )
            : null;
          const progressPct =
            hasCapacity && reservedBeds !== null
              ? (reservedBeds / totalBeds) * 100
              : 0;

          if (!hasCapacity || reservedBeds === null) {
            return <div className="whitespace-nowrap">N/A</div>;
          }

          return (
            <div className="flex items-center gap-3">
              <div className="h-4 w-[150px] overflow-hidden rounded-full border border-slate-300 bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#FFC5BF] transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="leading-5 text-slate-700">
                {reservedBeds} / {totalBeds} beds
              </span>
            </div>
          );
        },
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '0.8fr',
        cellClassName: 'text-gray-600',
        render: (shelter) => renderTags(shelter.tags),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col">
      <form
        className="my-1 flex w-full flex-wrap items-center gap-3 bg-white px-3"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex h-11 w-full max-w-[380px] items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2">
          <span className="flex h-8 w-9 items-center justify-center rounded-full bg-[#FCF500] text-[#1E3342]">
            <Search size={20} />
          </span>
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

      <Table<Shelter, ShelterRowObject>
        columns={columns}
        rows={rows}
        getRowKey={getRowKey ?? ((shelter) => shelter.id)}
        getRowObject={(shelter) => {
          const totalBeds = shelter.totalBeds ?? 0;
          const reservedBeds = Math.min(
            Math.max(shelter.occupiedBeds ?? totalBeds, 0),
            totalBeds
          );

          return {
            id: shelter.id,
            shelter,
            name: shelter.name ?? 'N/A',
            address: shelter.address ?? 'N/A',
            totalBeds,
            reservedBeds,
            tags: shelter.tags ?? [],
          };
        }}
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
