import { mergeCss } from '@monorepo/react/shared';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { TableRow, type TableRowCell } from './TableRow';
import type { SortDirection, TableColumn, TableProps } from './types';
import { compareValues } from './utils';

const TableBase = <TItem, TRowObject = TItem>({
  columns,
  rows,
  getRowKey,
  getRowObject,
  getRowSlot,
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
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  onSortChange,
}: TableProps<TItem, TRowObject>) => {
  const isControlled = onSortChange !== undefined;

  const [internalSortColumn, setInternalSortColumn] = useState<string | null>(
    null
  );
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection | null>(null);

  const sortColumn = isControlled
    ? controlledSortColumn ?? null
    : internalSortColumn;
  const sortDirection = isControlled
    ? controlledSortDirection ?? null
    : internalSortDirection;

  const handleSortToggle = useCallback(
    (columnKey: string) => {
      const column = columns.find((c) => c.key === columnKey);

      if (!column?.sortValue) {
        return;
      }

      let nextColumn: string | null;
      let nextDirection: SortDirection | null;

      if (sortColumn !== columnKey) {
        nextColumn = columnKey;
        nextDirection = 'asc';
      } else if (sortDirection === 'asc') {
        nextColumn = columnKey;
        nextDirection = 'desc';
      } else {
        nextColumn = null;
        nextDirection = null;
      }

      if (isControlled) {
        onSortChange(nextColumn, nextDirection);
      } else {
        setInternalSortColumn(nextColumn);
        setInternalSortDirection(nextDirection);
      }
    },
    [columns, sortColumn, sortDirection, isControlled, onSortChange]
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return rows;
    }

    const sortableColumn = columns.find((c) => c.key === sortColumn);
    if (!sortableColumn?.sortValue) {
      return rows;
    }

    const sortFn = sortableColumn.sortValue;
    return [...rows].sort((a, b) => {
      const valA = sortFn(a);
      const valB = sortFn(b);
      return compareValues(valA, valB, sortDirection);
    });
  }, [rows, sortColumn, sortDirection, columns]);

  const dataTemplateColumns = columns
    .map((column) => column.width ?? '1fr')
    .join(' ');

  const hasTrailingColumn = !!onDelete || !!getRowSlot || !!trailingHeader;
  const templateColumns = hasTrailingColumn
    ? `${dataTemplateColumns} ${trailingColumnWidth}`
    : dataTemplateColumns;

  function renderSortIcon(column: TableColumn<TItem>) {
    if (!column.sortValue) {
      return null;
    }

    if (sortColumn !== column.key || !sortDirection) {
      return <ArrowUpDown size={16} className="text-[#B0B5BD]" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp size={16} className="text-[#3D7FFF]" />;
    }

    return <ArrowDown size={16} className="text-[#3D7FFF]" />;
  }

  return (
    <div
      role="table"
      className={mergeCss([
        'bg-white rounded-2xl overflow-hidden w-full',
        wrapperClassName,
      ])}
      style={tableStyle}
    >
      <div
        role="row"
        className={mergeCss([
          'grid items-center px-6 pb-2 pt-6 font-medium text-[22px] text-[#747A82]',
          headerClassName,
          headerInsetClassName,
        ])}
        style={{ gridTemplateColumns: templateColumns, ...headerStyle }}
      >
        {columns.map((column) => (
          <div
            role="columnheader"
            key={column.key}
            aria-sort={
              sortColumn === column.key
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
            tabIndex={column.sortValue ? 0 : undefined}
            onClick={
              column.sortValue ? () => handleSortToggle(column.key) : undefined
            }
            onKeyDown={
              column.sortValue
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortToggle(column.key);
                    }
                  }
                : undefined
            }
            className={mergeCss([
              'text-left justify-self-start',
              column.sortValue &&
                'cursor-pointer select-none flex items-center gap-1',
              column.headerClassName,
            ])}
          >
            {column.label}
            {renderSortIcon(column)}
          </div>
        ))}
        {hasTrailingColumn && (
          <div aria-hidden="true" className="justify-self-end">
            {trailingHeader || null}
          </div>
        )}
      </div>

      {loading && loadingState}

      {!loading && sortedRows.length === 0 && emptyState}

      {!loading &&
        sortedRows.map((item, index) => {
          const rowObject = getRowObject
            ? getRowObject(item, index)
            : (item as unknown as TRowObject);

          const cells: TableRowCell[] = columns.map((column) => ({
            key: column.key,
            content: column.render(item),
            className: column.cellClassName,
          }));

          const rowSlot = getRowSlot?.(rowObject, item, index);

          return (
            <TableRow
              key={getRowKey(item, index)}
              cells={cells}
              rowObject={rowObject}
              rowIndex={index}
              slot={rowSlot}
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
};

export default TableBase;

type TableComponent = typeof TableBase & {
  Row: typeof TableRow;
};

export const Table = Object.assign(TableBase, {
  Row: TableRow,
}) as TableComponent;
