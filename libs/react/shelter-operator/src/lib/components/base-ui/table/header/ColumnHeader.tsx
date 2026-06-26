import { mergeCss } from '@monorepo/react/shared';
import { Filter } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { SortDirection, TableColumn } from '../types';
import { ColumnFilter, type ColumnFilterOption } from './ColumnFilter';
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
  labelClassName?: string;
  /** Resolved filter options (auto-derived from data or explicit override). */
  filterOptions?: ColumnFilterOption[];
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
  filterOptions,
  labelClassName,
}: ColumnHeaderProps<TItem>) {
  const isFilterOpen = openFilterColumn === column.key;

  const isSortable = !!column.sortValue;
  const isFilterable = !!column.filterValue;

  const LabelTag = isSortable ? 'button' : 'span';

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
      className={mergeCss([
        'text-left',
        'justify-self-start',
        isFilterable && 'relative',
        (isSortable || isFilterable) && 'flex items-center gap-1',
        column.headerClassName,
      ])}
    >
      {isFilterOpen && (
        <ColumnFilter
          value={filters[column.key] ?? ''}
          onChange={(v) => onFilterChange(column.key, v)}
          onClear={() => onClearFilter(column.key)}
          filterOptions={filterOptions}
        />
      )}

      <div className="flex items-center gap-1">
        <LabelTag
          type={isSortable ? 'button' : undefined}
          onClick={isSortable ? () => onSortToggle(column.key) : undefined}
          className={mergeCss([
            'flex items-center gap-1 bg-transparent border-none p-0 font-inherit text-inherit text-[22px]',
            isSortable && 'cursor-pointer select-none',
            labelClassName,
          ])}
        >
          {column.label}
          {isSortable && (
            <SortIcon
              isActive={
                activeSortColumn === column.key && !!activeSortDirection
              }
              direction={activeSortDirection}
            />
          )}
        </LabelTag>

        {isFilterable && (
          <button
            type="button"
            className={mergeCss([
              'bg-transparent border-none p-0 cursor-pointer',
              filters[column.key] ? 'text-[#3D7FFF]' : 'text-[#B0B5BD]',
            ])}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFilterColumn((prev) =>
                prev === column.key ? null : column.key
              );
            }}
          >
            <Filter size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
