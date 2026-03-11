import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { Table, type TableColumn } from './Table';
import type { Shelter } from '../types/shelter';

export type ShelterRowObject = {
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
}: ShelterTableProps) {
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
  );
}
