import { CopyPlus, Minus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { BedStatusChoices } from '../apollo/graphql/__generated__/types';
import type { BedListItem, BedRoomForList, BedRowObject } from '../types/bed';
import { Button } from './base-ui/buttons';
import { Table, type TableColumn } from './Table';

const MAX_VISIBLE_TAG_CHAR_COUNT = 15;

function renderTags(tags: string[] | null) {
  const validTags = (tags ?? []).filter((tag) => Boolean(tag?.trim()));
  const hardcodedTags = ['Women Only', 'Shared', 'Pets Allowed', 'No Parking'];
  const tagsToShow = validTags.length > 0 ? validTags : hardcodedTags;

  let visibleCharCount = 0;
  const visibleTags = tagsToShow.filter((tag) => {
    const nextCount = visibleCharCount + tag.length;
    if (nextCount >= MAX_VISIBLE_TAG_CHAR_COUNT) return false;
    visibleCharCount += tag.length;
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

type FlatBedRow = {
  bed: BedListItem;
  roomAssignment: string;
  rowIndex: number;
};

function flattenRooms(rooms: BedRoomForList[]): FlatBedRow[] {
  const out: FlatBedRow[] = [];
  for (const room of rooms) {
    for (const bed of room.beds) {
      out.push({
        bed,
        roomAssignment: room.roomLabel,
        rowIndex: out.length,
      });
    }
  }
  return out;
}

function statusLabel(
  status: BedStatusChoices | null | undefined,
  maintenanceFlag?: boolean
): string {
  if (status === BedStatusChoices.OutOfService && maintenanceFlag) {
    return 'Out of Service - Maintenance';
  }
  switch (status) {
    case BedStatusChoices.Available:
      return 'Available';
    case BedStatusChoices.Occupied:
      return 'Occupied';
    case BedStatusChoices.Reserved:
      return 'Reserved';
    case BedStatusChoices.OutOfService:
      return 'Out of Service';
    default:
      return 'Unknown';
  }
}

function BedStatusBadge({
  status,
  maintenanceFlag,
}: {
  status: BedStatusChoices | null | undefined;
  maintenanceFlag?: boolean;
}) {
  const label = statusLabel(status, maintenanceFlag);

  const palette: Record<string, { bg: string; text: string }> = {
    Available: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    Occupied: { bg: 'bg-sky-100', text: 'text-sky-800' },
    Reserved: { bg: 'bg-amber-100', text: 'text-amber-800' },
    'Out of Service': { bg: 'bg-red-100', text: 'text-red-800' },
    'Out of Service - Maintenance': {
      bg: 'bg-red-100',
      text: 'text-red-800',
    },
    Unknown: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const { bg, text } = palette[label] ?? palette.Unknown;

  return (
    <span
      className={[
        'inline-flex max-w-full rounded-full px-3 py-1 text-xs font-medium',
        bg,
        text,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

type BedTableProps = {
  rooms: BedRoomForList[];
  getRowKey?: (item: FlatBedRow, index: number) => string;
  onRowClick?: (rowObject: BedRowObject, rowIndex: number) => void;
  selectedBedIds?: string[];
  onSelectedBedIdsChange?: (ids: string[]) => void;
  onDuplicate?: (rowObject: BedRowObject, rowIndex: number) => void;
  onEdit?: (rowObject: BedRowObject, rowIndex: number) => void;
  onDelete?: (rowObject: BedRowObject, rowIndex: number) => void;
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

function toRowObject(bed: BedListItem, roomAssignment: string): BedRowObject {
  return {
    bedId: bed.id,
    bedName: bed.bedName,
    status: bed.status,
    roomAssignment,
    tags: bed.tags ?? [],
  };
}

export function BedTable({
  rooms,
  getRowKey,
  onRowClick,
  selectedBedIds,
  onSelectedBedIdsChange,
  onDuplicate,
  onEdit,
  onDelete,
  loading,
  loadingState,
  emptyState,
  wrapperClassName,
  headerClassName,
  rowClassName,
  tableStyle,
  headerStyle,
  rowStyle,
}: BedTableProps) {
  const rows = useMemo(() => flattenRooms(rooms), [rooms]);

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

  const columns: TableColumn<FlatBedRow>[] = useMemo(() => {
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
                aria-label={`Select ${bed.bedName}`}
              />
              <span
                className={[
                  'inline-flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white',
                  'peer-checked:border-[#008CEE] peer-checked:bg-[#008CEE]',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-[#008CEE] peer-focus-visible:ring-offset-1',
                  'peer-checked:[&_.bed-row-select-minus]:opacity-100',
                ].join(' ')}
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
      ...(onSelectedBedIdsChange ? [selectionColumn] : []),
      {
        key: 'bedId',
        label: 'Bed ID',
        width: '1.1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: ({ bed }) => bed.bedName || 'N/A',
      },
      {
        key: 'status',
        label: 'Status',
        width: 'minmax(140px, 1fr)',
        render: ({ bed }) => (
          <BedStatusBadge
            status={bed.status}
            maintenanceFlag={bed.maintenanceFlag}
          />
        ),
      },
      {
        key: 'room',
        label: 'Room Assignment',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: ({ roomAssignment }) => roomAssignment || '—',
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '1.1fr',
        cellClassName: 'text-gray-600',
        render: ({ bed }) => renderTags(bed.tags ?? null),
      },
      {
        key: 'actions',
        label: '',
        width: '140px',
        headerClassName: 'justify-self-end',
        cellClassName: 'justify-self-end',
        render: (row) => {
          const rowObject = toRowObject(row.bed, row.roomAssignment);
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
              role="group"
              aria-label="Bed actions"
            >
              {onDuplicate && (
                <Button
                  type="button"
                  variant="edit"
                  aria-label="Duplicate bed"
                  leftIcon={<CopyPlus size={22} stroke="black" />}
                  onClick={() => onDuplicate(rowObject, row.rowIndex)}
                />
              )}
              {onEdit && (
                <Button
                  type="button"
                  variant="edit"
                  aria-label="Edit bed"
                  onClick={() => onEdit(rowObject, row.rowIndex)}
                />
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="trash"
                  aria-label="Delete bed"
                  onClick={() => onDelete(rowObject, row.rowIndex)}
                />
              )}
            </div>
          );
        },
      },
    ];
  }, [
    onDuplicate,
    onEdit,
    onDelete,
    onSelectedBedIdsChange,
    selectedSet,
    toggleOne,
  ]);

  return (
    <Table<FlatBedRow, BedRowObject>
      columns={columns}
      rows={rows}
      getRowKey={getRowKey ?? ((row) => row.bed.id)}
      getRowObject={(row) => toRowObject(row.bed, row.roomAssignment)}
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
