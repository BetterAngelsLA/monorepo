import { useCallback, useMemo, useState } from 'react';
import type { SortDirection, TableColumn, TableProps } from '../types';
import type { ColumnFilterOption } from './ColumnFilter';
import { compareValues, matchesFilter } from '../utils';

type UseTableSortFilterParams<TItem> = {
  columns: TableColumn<TItem>[];
  rows: TItem[];
  sortColumn?: TableProps<TItem>['sortColumn'];
  sortDirection?: TableProps<TItem>['sortDirection'];
  onSortChange?: TableProps<TItem>['onSortChange'];
  filters?: TableProps<TItem>['filters'];
  onFilterChange?: TableProps<TItem>['onFilterChange'];
};

export function useTableSortFilter<TItem>({
  columns,
  rows,
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  onSortChange,
  filters: controlledFilters,
  onFilterChange,
}: UseTableSortFilterParams<TItem>) {
  // sort state
  const isSortControlled = onSortChange !== undefined;

  const [internalSortColumn, setInternalSortColumn] = useState<string | null>(
    null
  );
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection | null>(null);

  const sortColumn = isSortControlled
    ? controlledSortColumn ?? null
    : internalSortColumn;

  const sortDirection = isSortControlled
    ? controlledSortDirection ?? null
    : internalSortDirection;

  const handleSortToggle = useCallback(
    (columnKey: string) => {
      const column = columns.find((c) => c.key === columnKey);
      if (!column?.sortValue) return;

      const currentCol = sortColumn;
      const currentDir = sortDirection;

      let nextColumn: string | null;
      let nextDirection: SortDirection | null;

      if (currentCol !== columnKey) {
        nextColumn = columnKey;
        nextDirection = 'asc';
      } else if (currentDir === 'asc') {
        nextColumn = columnKey;
        nextDirection = 'desc';
      } else {
        nextColumn = null;
        nextDirection = null;
      }

      if (isSortControlled) {
        onSortChange(nextColumn, nextDirection);
      } else {
        setInternalSortColumn(nextColumn);
        setInternalSortDirection(nextDirection);
      }
    },
    [columns, sortColumn, sortDirection, isSortControlled, onSortChange]
  );

  // filter state
  const isFilterControlled = onFilterChange !== undefined;

  const [internalFilters, setInternalFilters] = useState<
    Record<string, string>
  >({});

  const filters = useMemo(
    () => (isFilterControlled ? controlledFilters ?? {} : internalFilters),
    [isFilterControlled, controlledFilters, internalFilters]
  );

  const handleFilterChange = useCallback(
    (columnKey: string, value: string) => {
      if (isFilterControlled) {
        onFilterChange(columnKey, value);
      } else {
        setInternalFilters((prev) => ({ ...prev, [columnKey]: value }));
      }
    },
    [isFilterControlled, onFilterChange]
  );

  // filter options: explicit list > auto-derived > none
  const resolvedFilterOptions = useMemo<
    Record<string, ColumnFilterOption[]>
  >(() => {
    const result: Record<string, ColumnFilterOption[]> = {};

    for (const column of columns) {
      if (!column.filterValue) {
        continue;
      }

      const fmt = column.renderFilterOption;

      // Explicit list always takes precedence
      if (column.filterOptions) {
        result[column.key] = fmt
          ? column.filterOptions.map((o) => ({ ...o, label: fmt(o.value) }))
          : column.filterOptions;

        continue;
      }

      // Auto-derive only when explicitly opted in (safe for low-cardinality columns)
      if (column.autoFilterOptions) {
        const uniqueValues = [...new Set(rows.map(column.filterValue))].sort();

        result[column.key] = uniqueValues.map((v) => ({
          label: fmt ? fmt(v) : v,
          value: v,
        }));
      }
    }

    return result;
  }, [columns, rows]);

  // pipeline: filter → sort
  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(
      ([, v]) => v.trim() !== ''
    );

    if (activeFilters.length === 0) {
      return rows;
    }

    return rows.filter((item) =>
      activeFilters.every(([key, filterText]) => {
        const column = columns.find((c) => c.key === key);

        if (!column?.filterValue) {
          return true;
        }

        return matchesFilter(column.filterValue(item), filterText);
      })
    );
  }, [rows, filters, columns]);

  const visibleRows = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredRows;
    }

    const sortableColumn = columns.find((c) => c.key === sortColumn);
    if (!sortableColumn?.sortValue) {
      return filteredRows;
    }

    const sortFn = sortableColumn.sortValue;

    return [...filteredRows].sort((a, b) => {
      const valA = sortFn(a);
      const valB = sortFn(b);
      return compareValues(valA, valB, sortDirection);
    });
  }, [filteredRows, sortColumn, sortDirection, columns]);

  return {
    visibleRows,
    sortColumn,
    sortDirection,
    handleSortToggle,
    filters,
    handleFilterChange,
    resolvedFilterOptions,
  } as const;
}
