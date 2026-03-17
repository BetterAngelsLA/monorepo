import type { CSSProperties, ReactNode } from 'react';
import { Text } from './base-ui/text/text';
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
  trailingColumnWidth?: string;
  trailingHeader?: ReactNode;
  getTrailingContent?: (
    rowObject: TRowObject,
    item: TItem,
    index: number
  ) => ReactNode;
  headerInsetClassName?: string;
  rowInsetClassName?: string;
  onRowClick?: RowClickHandler<TRowObject>;
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

export function Table<TItem, TRowObject = TItem>({
  columns,
  rows,
  getRowKey,
  getRowObject,
  trailingColumnWidth = '56px',
  trailingHeader,
  getTrailingContent,
  headerInsetClassName = 'px-6 py-2 pt-6',
  onRowClick,
  loading = false,
  loadingState,
  emptyState,
  wrapperClassName = '',
  headerClassName = '',
  rowClassName = '',
  tableStyle,
  headerStyle,
  rowStyle,
}: TableProps<TItem, TRowObject>) {
  const dataTemplateColumns = columns
    .map((column) => column.width ?? '1fr')
    .join(' ');
  const templateColumns = `${dataTemplateColumns} ${trailingColumnWidth}`;

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
          'grid items-center',
          headerInsetClassName,
          headerClassName,
        ].join(' ')}
        style={{ gridTemplateColumns: templateColumns, ...headerStyle }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={[
              'text-left justify-self-start',
              column.headerClassName ?? '',
            ]
              .join(' ')
              .trim()}
          >
            {typeof column.label === 'string' ||
            typeof column.label === 'number' ? (
              <Text variant="body" className="text-[#767676]">
                {column.label}
              </Text>
            ) : (
              column.label
            )}
          </div>
        ))}
        <div aria-hidden="true">{trailingHeader}</div>
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
              templateColumns={templateColumns}
              className={rowClassName}
              style={rowStyle}
            />
          );
        })}
    </div>
  );
}
