import type { CSSProperties, ReactNode } from 'react';
import { Row, type RowCell, type RowClickHandler } from './Row';

export type TableColumn<TItem> = {
  key: string;
  label: ReactNode;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: TItem) => ReactNode;
};

type TableProps<TItem, TRowObject = TItem> = {
  columns: TableColumn<TItem>[];
  rows: TItem[];
  getRowKey: (item: TItem, index: number) => string;
  getRowObject?: (item: TItem, index: number) => TRowObject;
  getTrailingContent?: (
    rowObject: TRowObject,
    item: TItem,
    index: number
  ) => ReactNode;
  trailingHeader?: ReactNode;
  trailingColumnWidth?: string;
  onRowClick?: RowClickHandler<TRowObject>;
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
};

export function Table<TItem, TRowObject = TItem>({
  columns,
  rows,
  getRowKey,
  getRowObject,
  getTrailingContent,
  trailingHeader,
  trailingColumnWidth = '80px',
  onRowClick,
  onDelete,
  loading = false,
  loadingState,
  emptyState,
  wrapperClassName = '',
  headerClassName = '',
  headerInsetClassName = '',
  rowClassName = '',
  rowInsetClassName = '',
  tableStyle,
  headerStyle,
  rowStyle,
}: TableProps<TItem, TRowObject>) {
  const dataTemplateColumns = columns
    .map((column) => column.width ?? '1fr')
    .join(' ');
  const hasTrailingColumn =
    !!onDelete || !!getTrailingContent || !!trailingHeader;
  const templateColumns = hasTrailingColumn
    ? `${dataTemplateColumns} ${trailingColumnWidth}`
    : dataTemplateColumns;

  return (
    <div
      role="table"
      className={[
        'bg-white rounded-2xl overflow-hidden w-full',
        wrapperClassName,
      ]
        .join(' ')
        .trim()}
      style={tableStyle}
    >
      <div
        role="row"
        className={[
          'grid items-center px-6 pb-2 pt-6 font-medium text-[22px] text-[#747A82]',
          headerClassName,
          headerInsetClassName,
        ].join(' ')}
        style={{ gridTemplateColumns: templateColumns, ...headerStyle }}
      >
        {columns.map((column) => (
          <div
            role="columnheader"
            key={column.key}
            className={[
              'text-left justify-self-start',
              column.headerClassName ?? '',
            ]
              .join(' ')
              .trim()}
          >
            {column.label}
          </div>
        ))}
        {hasTrailingColumn && (
          <div aria-hidden="true" className="justify-self-end">
            {trailingHeader || null}
          </div>
        )}
      </div>

      {loading && loadingState}

      {!loading && rows.length === 0 && emptyState}

      {!loading &&
        rows.map((item, index) => {
          const rowObject = getRowObject
            ? getRowObject(item, index)
            : (item as unknown as TRowObject);

          const cells: RowCell[] = columns.map((column) => ({
            key: column.key,
            content: column.render(item),
            className: column.cellClassName,
          }));

          return (
            <Row
              key={getRowKey(item, index)}
              cells={cells}
              rowObject={rowObject}
              rowIndex={index}
              trailingContent={getTrailingContent?.(rowObject, item, index)}
              onRowClick={onRowClick}
              onDelete={onDelete}
              templateColumns={templateColumns}
              className={rowClassName}
              rowInsetClassName={rowInsetClassName}
              style={rowStyle}
            />
          );
        })}
    </div>
  );
}
