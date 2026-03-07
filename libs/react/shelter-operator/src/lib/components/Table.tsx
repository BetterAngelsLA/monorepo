import type { CSSProperties, ReactNode } from 'react';
import { Row, type RowCell } from './Row';

type CellAlign = 'left' | 'center' | 'right';

export type TableColumn<TItem> = {
  key: string;
  label: ReactNode;
  width?: string;
  align?: CellAlign;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: TItem) => ReactNode;
};

type TableProps<TItem> = {
  columns: TableColumn<TItem>[];
  rows: TItem[];
  getRowKey: (item: TItem, index: number) => string;
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

function getAlignmentClass(align: CellAlign = 'left'): string {
  if (align === 'right') return 'text-right justify-self-end';
  if (align === 'center') return 'text-center justify-self-center';
  return 'text-left justify-self-start';
}

export function Table<TItem>({
  columns,
  rows,
  getRowKey,
  loading = false,
  loadingState,
  emptyState,
  wrapperClassName = '',
  headerClassName = '',
  rowClassName = '',
  tableStyle,
  headerStyle,
  rowStyle,
}: TableProps<TItem>) {
  const templateColumns = columns
    .map((column) => column.width ?? '1fr')
    .join(' ');

  return (
    <div
      className={[
        'bg-white rounded-2xl overflow-hidden w-full',
        wrapperClassName,
      ]
        .join(' ')
        .trim()}
      style={tableStyle}
    >
      <div
        className={[
          'grid items-center px-6 py-3 text-xs font-semibold tracking-wider text-gray-700',
          headerClassName,
        ].join(' ')}
        style={{ gridTemplateColumns: templateColumns, ...headerStyle }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={[
              getAlignmentClass(column.align),
              column.headerClassName ?? '',
            ]
              .join(' ')
              .trim()}
          >
            {column.label}
          </div>
        ))}
      </div>

      {loading && loadingState}

      {!loading && rows.length === 0 && emptyState}

      {!loading &&
        rows.map((item, index) => {
          const cells: RowCell[] = columns.map((column) => ({
            key: column.key,
            content: column.render(item),
            align: column.align,
            className: column.cellClassName,
          }));

          return (
            <Row
              key={getRowKey(item, index)}
              cells={cells}
              templateColumns={templateColumns}
              className={rowClassName}
              style={rowStyle}
            />
          );
        })}
    </div>
  );
}
