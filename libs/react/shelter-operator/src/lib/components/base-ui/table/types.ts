import type { CSSProperties, ReactNode } from 'react';
import type { TableRowClickHandler } from './TableRow';

export type SortDirection = 'asc' | 'desc';

import type { ColumnFilterOption } from './header/ColumnFilter';

export type TableColumn<TItem> = {
  key: string;
  label: ReactNode;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: TItem) => ReactNode;
  /** When provided, the column becomes sortable. Extracts a string or number from an item for comparison. */
  sortValue?: (item: TItem) => string | number;
  /** When provided, the column becomes filterable with a text input below its header. */
  filterValue?: (item: TItem) => string;
  /**
   * Explicit filter options shown as clickable chips in the column filter
   * popover. Use for custom ordering, labels different from raw values, or
   * limiting which options appear.
   */
  filterOptions?: ColumnFilterOption[];
  /**
   * When `true` and {@link filterOptions} is not set, unique values are
   * auto-derived from row data. Only enable for low-cardinality columns
   * (e.g. status enums with 2–10 values).
   */
  autoFilterOptions?: boolean;
  /**
   * Transforms a raw filter value into its display label in the filter
   * popover pills. Mirrors the column's {@link render} formatting so pills
   * look consistent with cell values (e.g. `(v) => v.toLowerCase()`).
   * Applied to both auto-derived and explicit {@link filterOptions}.
   */
  renderFilterOption?: (value: string) => string;
};

export type TableProps<TItem, TRowObject = TItem> = {
  columns: TableColumn<TItem>[];
  rows: TItem[];
  getRowKey: (item: TItem, index: number) => string;
  getRowObject?: (item: TItem, index: number) => TRowObject;
  getRowSlot?: (rowObject: TRowObject, item: TItem, index: number) => ReactNode;
  trailingHeader?: ReactNode;
  trailingColumnWidth?: string;
  onRowClick?: TableRowClickHandler<TRowObject>;
  onDelete?: (rowObject: TRowObject, rowIndex: number) => void;
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
  /** Controlled sort column key. */
  sortColumn?: string | null;
  /** Controlled sort direction. */
  sortDirection?: SortDirection;
  /** Called when the user clicks a sortable column header. */
  onSortChange?: (
    column: string | null,
    direction: SortDirection | null
  ) => void;
  /** Controlled filter values keyed by column key. */
  filters?: Record<string, string>;
  /** Called when a filter input value changes. */
  onFilterChange?: (columnKey: string, value: string) => void;
};
