import type { StatusChoices } from '@monorepo/ba-platform/types';
import { enumStatusChoices } from '@monorepo/react/shelter';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import type { Shelter } from '../types/shelter';
import { Table, type SortDirection, type TableColumn } from './base-ui/table';

export type ShelterRowObject = {
  id: string;
  name: string;
  address: string;
  totalBeds: number;
  unavailableBeds: number;
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
  /** Controlled sort column key (matches a sortable column's `key`). */
  sortColumn?: string | null;
  /** Controlled sort direction. */
  sortDirection?: SortDirection;
  /** Called when the user clicks a sortable column header. */
  onSortChange?: (
    column: string | null,
    direction: SortDirection | null,
  ) => void;
};

function getUnavailableBeds(shelter: Shelter) {
  return shelter.bedCounts.total - (shelter.bedCounts.available ?? 0);
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
  sortColumn,
  sortDirection,
  onSortChange,
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
        sortValue: (shelter) => shelter.name ?? '',
      },
      {
        key: 'address',
        label: 'Address',
        width: '1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.address ?? 'No address listed',
      },
      {
        key: 'capacity',
        label: 'Capacity',
        width: '1.2fr',
        cellClassName: 'whitespace-nowrap text-gray-700',
        render: (shelter) => {
          const unavailableBeds = getUnavailableBeds(shelter);
          const progressPct =
            shelter.bedCounts.total > 0
              ? (unavailableBeds / shelter.bedCounts.total) * 100
              : 0;

          if (shelter.bedCounts.total === 0) {
            return (
              <div className="whitespace-nowrap">No availability data</div>
            );
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
                {unavailableBeds} / {shelter.bedCounts.total} beds
              </span>
            </div>
          );
        },
        sortValue: (shelter) => shelter.bedCounts.total,
      },
      {
        key: 'organization',
        label: 'Organization',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.organization?.name ?? '—',
        sortValue: (shelter) => shelter.organization?.name ?? '',
      },
      {
        key: 'status',
        label: 'Status',
        width: '0.8fr',
        cellClassName: 'text-gray-600',
        render: (shelter) =>
          enumStatusChoices[shelter.status as StatusChoices] ?? shelter.status,
        sortValue: (shelter) => shelter.status,
      },
    ],
    [],
  );

  return (
    <Table<Shelter, ShelterRowObject>
      columns={columns}
      rows={rows}
      getRowKey={getRowKey ?? ((shelter) => shelter.id)}
      getRowObject={(shelter) => {
        const unavailableBeds = getUnavailableBeds(shelter);

        return {
          id: shelter.id,
          name: shelter.name ?? 'N/A',
          address: shelter.address ?? 'N/A',
          totalBeds: shelter.bedCounts.total,
          unavailableBeds,
        };
      }}
      onRowClick={onRowClick}
      loading={loading}
      loadingState={loadingState}
      emptyState={emptyState}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      wrapperClassName={wrapperClassName}
      headerClassName={headerClassName}
      rowClassName={rowClassName}
      tableStyle={tableStyle}
      headerStyle={headerStyle}
      rowStyle={rowStyle}
    />
  );
}
