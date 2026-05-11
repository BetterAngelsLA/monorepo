import { mergeCss } from '@monorepo/react/shared';
import { CopyPlus, Minus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import {
  BedStatusChoices,
  BedTypeChoices,
  type BedType,
} from '../apollo/graphql/__generated__/types';
import { Button } from './base-ui/buttons';
import { Table, type TableColumn } from './Table';

export type BedRoomForList = {
  id: string;
  roomLabel: string;
  beds: BedType[];
};

export type BedRowObject = {
  bedId: string;
  bedName: string;
  status?: BedType['status'];
  roomId: string;
  roomAssignment: string;
};

export type BedTableVariant = 'default' | 'reservation';

export type ReservationLayoutStyle = 'congregate' | 'motel' | 'mixed';

export type ReservationBedRowMeta = {
  tags: string[];
  suggested?: boolean;
  maxVisibleTags?: number;
};

export type MotelRoomRow = {
  room: BedRoomForList;
  flatIndex: number;
};

export type ReservationTableRow = FlatBedRow | MotelRoomRow;

type FlatBedRow = {
  bed: BedType;
  roomId: string;
  roomAssignment: string;
  flatIndex: number;
};

function isMotelRoomRow(row: ReservationTableRow): row is MotelRoomRow {
  return 'room' in row && !('bed' in row);
}

const BED_TYPE_LABEL: Record<BedTypeChoices, string> = {
  [BedTypeChoices.Twin]: 'Twin',
  [BedTypeChoices.Bunk]: 'Bunk',
  [BedTypeChoices.Rollaway]: 'Rollaway',
  [BedTypeChoices.Other]: 'Other',
};

function flattenRooms(rooms: BedRoomForList[]): FlatBedRow[] {
  const out: FlatBedRow[] = [];
  let flatIndex = 0;
  for (const room of rooms) {
    for (const bed of room.beds) {
      out.push({
        bed,
        roomId: room.id,
        roomAssignment: room.roomLabel,
        flatIndex: flatIndex++,
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
      className={mergeCss([
        'inline-flex max-w-full rounded-full px-3 py-1 text-xs font-medium',
        bg,
        text,
      ])}
    >
      {label}
    </span>
  );
}

function ReservationTagPill({
  children,
  variant = 'muted',
}: {
  children: ReactNode;
  variant?: 'muted' | 'primary';
}) {
  return (
    <span
      className={mergeCss([
        'inline-flex rounded-full px-3 py-1 text-xs font-medium leading-none',
        variant === 'primary'
          ? 'bg-[#008CEE] text-white'
          : 'bg-[#EDEFF5] text-[#747A82]',
      ])}
    >
      {children}
    </span>
  );
}

function ReservationTagsCell({ meta }: { meta: ReservationBedRowMeta }) {
  const max = meta.maxVisibleTags ?? (meta.suggested ? 1 : 2);
  const tags = meta.tags;
  const visible = tags.slice(0, max);
  const rest = Math.max(tags.length - visible.length, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {meta.suggested && (
        <ReservationTagPill variant="primary">Suggested</ReservationTagPill>
      )}
      {visible.map((tag) => (
        <ReservationTagPill key={tag}>{tag}</ReservationTagPill>
      ))}
      {rest > 0 && <ReservationTagPill>+ {rest}</ReservationTagPill>}
    </div>
  );
}

function defaultReservationMetaMotel(row: MotelRoomRow): ReservationBedRowMeta {
  if (row.flatIndex === 0) {
    return {
      suggested: true,
      tags: ['DMH', 'Overflow', 'Shared'],
      maxVisibleTags: 1,
    };
  }
  return { tags: ['DMH', 'Air Conditioning'] };
}

function createDefaultReservationMeta(layout: ReservationLayoutStyle) {
  return (row: ReservationTableRow): ReservationBedRowMeta => {
    if (isMotelRoomRow(row)) {
      return defaultReservationMetaMotel(row);
    }
    if (row.flatIndex !== 0) {
      return { tags: ['DMH', 'Air Conditioning'] };
    }
    const tags =
      layout === 'mixed'
        ? ['DMH', 'Seniors', 'Overflow', 'Shared']
        : ['DMH', 'Overflow', 'Shared'];
    return { suggested: true, tags, maxVisibleTags: 1 };
  };
}

function ReservationLinkName({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  return (
    <span
      className={mergeCss([
        'text-sm font-medium text-[#008CEE] hover:underline',
        selected && 'underline decoration-2',
      ])}
    >
      {label || '—'}
    </span>
  );
}

type BedTableProps = {
  rooms: BedRoomForList[];
  variant?: BedTableVariant;
  /** Only when `variant="reservation"`. */
  reservationLayoutStyle?: ReservationLayoutStyle;
  /** Mixed layout: value in the “Number of Occupants” column (e.g. from API). */
  getMixedOccupantCount?: (row: FlatBedRow) => number;
  /** Reservation layout: override tag pills per row. */
  getReservationRowMeta?: (row: ReservationTableRow) => ReservationBedRowMeta;
  /** Default (operator) table only; reservation rows use bed or room ids. */
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
    bedName: bed.bedName ?? '',
    status: bed.status,
    roomId,
    roomAssignment,
  };
}

function motelRowToRowObject(room: BedRoomForList): BedRowObject {
  return {
    bedId: room.id,
    bedName: room.roomLabel,
    roomId: room.id,
    roomAssignment: room.roomLabel,
  };
}

export function BedTable({
  rooms,
  variant = 'default',
  reservationLayoutStyle = 'congregate',
  getMixedOccupantCount,
  getReservationRowMeta,
  getRowKey: getRowKeyFlat,
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
  headerInsetClassName,
  rowClassName,
  rowInsetClassName,
  tableStyle,
  headerStyle,
  rowStyle,
  trailingColumnWidth = '140px',
}: BedTableProps) {
  const flatBedRows = useMemo(() => flattenRooms(rooms), [rooms]);

  const reservationRows: ReservationTableRow[] = useMemo(() => {
    if (variant !== 'reservation') return [];
    if (reservationLayoutStyle === 'motel') {
      return rooms.map((room, flatIndex) => ({ room, flatIndex }));
    }
    return flatBedRows;
  }, [variant, reservationLayoutStyle, rooms, flatBedRows]);

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

  const hasActionSlot = !!(onDuplicate || onEdit || onDelete);
  const isReservation = variant === 'reservation';
  const showCheckboxColumn = !!onSelectedBedIdsChange && !isReservation;

  const metaFn = useMemo(
    () =>
      getReservationRowMeta ??
      createDefaultReservationMeta(reservationLayoutStyle),
    [getReservationRowMeta, reservationLayoutStyle]
  );

  const occupantFn = useMemo(
    () => getMixedOccupantCount ?? (() => 7),
    [getMixedOccupantCount]
  );

  const reservationColumns: TableColumn<ReservationTableRow>[] = useMemo(() => {
    if (reservationLayoutStyle === 'motel') {
      return [
        {
          key: 'roomName',
          label: 'Room Name',
          width: 'minmax(120px, 1fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'min-w-0',
          render: (row) => {
            if (!isMotelRoomRow(row)) return null;
            const selected = selectedSet.has(row.room.id);
            return (
              <ReservationLinkName
                label={row.room.roomLabel}
                selected={selected}
              />
            );
          },
        },
        {
          key: 'bedType',
          label: 'Bed Type',
          width: 'minmax(100px, 0.85fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'text-sm text-[#1E3342]',
          render: () => 'Bed Type',
        },
        {
          key: 'bedCount',
          label: 'Number of Beds',
          width: 'minmax(100px, 0.75fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'text-sm text-[#1E3342]',
          render: (r) => (isMotelRoomRow(r) ? String(r.room.beds.length) : '—'),
        },
        {
          key: 'tags',
          label: 'Tags',
          width: 'minmax(180px, 1.3fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'min-w-0',
          render: (row) => <ReservationTagsCell meta={metaFn(row)} />,
        },
      ];
    }

    if (reservationLayoutStyle === 'mixed') {
      return [
        {
          key: 'bedName',
          label: 'Bed Name',
          width: 'minmax(160px, 1.4fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'min-w-0',
          render: (row) => {
            if (isMotelRoomRow(row)) return null;
            const selected = selectedSet.has(row.bed.id);
            const label = `${row.roomAssignment}, Bed ${
              row.bed.bedName ?? ''
            }`.trim();
            return <ReservationLinkName label={label} selected={selected} />;
          },
        },
        {
          key: 'bedType',
          label: 'Bed Type',
          width: 'minmax(100px, 0.75fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'text-sm text-[#1E3342]',
          render: (row) =>
            !isMotelRoomRow(row) && row.bed.bedType
              ? BED_TYPE_LABEL[row.bed.bedType] ?? row.bed.bedType
              : 'Bed Type',
        },
        {
          key: 'occupants',
          label: 'Number of Occupants',
          width: 'minmax(120px, 0.9fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'text-sm text-[#1E3342]',
          render: (row) =>
            !isMotelRoomRow(row) ? String(occupantFn(row)) : '—',
        },
        {
          key: 'tags',
          label: 'Tags',
          width: 'minmax(180px, 1.2fr)',
          headerClassName: '!text-sm !font-medium',
          cellClassName: 'min-w-0',
          render: (row) => <ReservationTagsCell meta={metaFn(row)} />,
        },
      ];
    }

    // congregate
    return [
      {
        key: 'bedName',
        label: 'Bed Name',
        width: 'minmax(120px, 1fr)',
        headerClassName: '!text-sm !font-medium',
        cellClassName: 'min-w-0',
        render: (row) => {
          if (isMotelRoomRow(row)) return null;
          const selected = selectedSet.has(row.bed.id);
          return (
            <ReservationLinkName
              label={row.bed.bedName ?? ''}
              selected={selected}
            />
          );
        },
      },
      {
        key: 'bedType',
        label: 'Bed Type',
        width: 'minmax(100px, 0.9fr)',
        headerClassName: '!text-sm !font-medium',
        cellClassName: 'text-sm text-[#1E3342]',
        render: (row) =>
          !isMotelRoomRow(row) && row.bed.bedType
            ? BED_TYPE_LABEL[row.bed.bedType] ?? row.bed.bedType
            : 'Bed Type',
      },
      {
        key: 'tags',
        label: 'Tags',
        width: 'minmax(200px, 1.4fr)',
        headerClassName: '!text-sm !font-medium',
        cellClassName: 'min-w-0',
        render: (row) => <ReservationTagsCell meta={metaFn(row)} />,
      },
    ];
  }, [metaFn, occupantFn, reservationLayoutStyle, selectedSet]);

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
                aria-label={`Select ${bed.bedName}`}
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
    ];
  }, [showCheckboxColumn, selectedSet, toggleOne]);

  const reservationHeaderClass =
    '!text-sm !font-medium !normal-case !pb-3 !pt-5 !text-[#747A82]';
  const reservationRowClass = '!py-4 border-t border-gray-200';

  const sharedTableProps = {
    loading,
    loadingState,
    emptyState,
    wrapperClassName,
    headerClassName: mergeCss([
      isReservation && reservationHeaderClass,
      headerClassName,
    ]),
    headerInsetClassName,
    rowClassName: mergeCss([
      isReservation && reservationRowClass,
      rowClassName,
    ]),
    rowInsetClassName: isReservation ? '!mx-0 !px-6' : rowInsetClassName,
    tableStyle,
    headerStyle,
    rowStyle,
  };

  if (isReservation) {
    return (
      <Table<ReservationTableRow, BedRowObject>
        columns={reservationColumns}
        rows={reservationRows}
        getRowKey={(row) => (isMotelRoomRow(row) ? row.room.id : row.bed.id)}
        getRowObject={(row) =>
          isMotelRoomRow(row)
            ? motelRowToRowObject(row.room)
            : toRowObject(row.bed, row.roomId, row.roomAssignment)
        }
        onRowClick={onRowClick}
        {...sharedTableProps}
      />
    );
  }

  return (
    <Table<FlatBedRow, BedRowObject>
      columns={defaultColumns}
      rows={flatBedRows}
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
                {onDuplicate && (
                  <Button
                    type="button"
                    variant="edit"
                    aria-label="Duplicate bed"
                    leftIcon={<CopyPlus size={22} stroke="black" />}
                    onClick={() => onDuplicate(rowObject, rowIndex)}
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
                {onDelete && (
                  <Button
                    type="button"
                    variant="trash"
                    aria-label="Delete bed"
                    onClick={() => onDelete(rowObject, rowIndex)}
                  />
                )}
              </div>
            )
          : undefined
      }
      trailingColumnWidth={hasActionSlot ? trailingColumnWidth : undefined}
      onRowClick={onRowClick}
      {...sharedTableProps}
    />
  );
}
