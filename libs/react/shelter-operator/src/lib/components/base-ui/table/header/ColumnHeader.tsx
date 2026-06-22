import { mergeCss } from '@monorepo/react/shared';
import { Filter } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { SortDirection, TableColumn } from '../types';
import { ColumnFilter } from './ColumnFilter';
import { SortIcon } from './SortIcon';

type ColumnHeaderProps<TItem> = {
  column: TableColumn<TItem>;
  activeSortColumn: string | null;
  activeSortDirection: SortDirection | null;
  onSortToggle: (columnKey: string) => void;
  filters: Record<string, string>;
  onFilterChange: (columnKey: string, value: string) => void;
  onClearFilter: (columnKey: string) => void;
  openFilterColumn: string | null;
  setOpenFilterColumn: Dispatch<SetStateAction<string | null>>;
};

export function ColumnHeader<TItem>({
  column,
  activeSortColumn,
  activeSortDirection,
  onSortToggle,
  filters,
  onFilterChange,
  onClearFilter,
  openFilterColumn,
  setOpenFilterColumn,
}: ColumnHeaderProps<TItem>) {
  const isFilterOpen = openFilterColumn === column.key;

  return (
    <div
      role="columnheader"
      aria-sort={
        activeSortColumn === column.key
          ? activeSortDirection === 'asc'
            ? 'ascending'
            : ('descending' as const)
          : undefined
      }
      tabIndex={column.sortValue ? 0 : undefined}
      onClick={column.sortValue ? () => onSortToggle(column.key) : undefined}
      onKeyDown={
        column.sortValue
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSortToggle(column.key);
              }
            }
          : undefined
      }
      className={mergeCss([
        'text-left',
        'justify-self-start',
        column.filterValue && 'relative',
        (column.sortValue || column.filterValue) && 'flex items-center gap-1',
        column.sortValue && 'cursor-pointer select-none',
        column.headerClassName,
      ])}
    >
      {isFilterOpen && (
        <ColumnFilter
          value={filters[column.key] ?? ''}
          onChange={(v) => onFilterChange(column.key, v)}
          onClear={() => onClearFilter(column.key)}
        />
      )}

      <div className="flex items-center gap-1">
        {column.label}

        <SortIcon
          hasSortValue={!!column.sortValue}
          isActive={activeSortColumn === column.key && !!activeSortDirection}
          direction={activeSortDirection}
        />

        {column.filterValue && (
          <Filter
            size={14}
            className={mergeCss([
              'text-[#B0B5BD] cursor-pointer',
              filters[column.key] && 'text-[#3D7FFF]',
            ])}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFilterColumn((prev) =>
                prev === column.key ? null : column.key
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
