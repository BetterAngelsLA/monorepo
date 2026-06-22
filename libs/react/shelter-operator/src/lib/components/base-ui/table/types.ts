import type { CSSProperties, ReactNode } from 'react';
import type { TableRowClickHandler } from './TableRow';

export type SortDirection = 'asc' | 'desc';

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
