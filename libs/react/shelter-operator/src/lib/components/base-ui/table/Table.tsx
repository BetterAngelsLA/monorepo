import { mergeCss } from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { ColumnHeader } from './header/ColumnHeader';
import { useTableSortFilter } from './header/useTableSortFilter';
import { TableRow, type TableRowCell } from './TableRow';
import type { TableProps } from './types';

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
  labelClassName = '',
  rowClassName = '',
  rowInsetClassName = '',
  tableStyle,
  headerStyle,
  rowStyle,
  sortColumn,
  sortDirection,
  onSortChange,
  filters: controlledFilters,
  onFilterChange,
}: TableProps<TItem, TRowObject>) => {
  const {
    visibleRows,
    sortColumn: activeSortColumn,
    sortDirection: activeSortDirection,
    handleSortToggle,
    filters,
    handleFilterChange,
    resolvedFilterOptions,
  } = useTableSortFilter({
    columns,
    rows,
    sortColumn,
    sortDirection,
    onSortChange,
    filters: controlledFilters,
    onFilterChange,
  });

  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);

  const handleClearFilter = useCallback(
    (columnKey: string) => {
      handleFilterChange(columnKey, '');
      setOpenFilterColumn(null);
    },
    [handleFilterChange]
  );

  const dataTemplateColumns = columns
    .map((column) => column.width ?? '1fr')
    .join(' ');

  const hasTrailingColumn = !!onDelete || !!getRowSlot || !!trailingHeader;
  const templateColumns = hasTrailingColumn
    ? `${dataTemplateColumns} ${trailingColumnWidth}`
    : dataTemplateColumns;

  return (
    <div
      role="table"
      className={mergeCss(['bg-white rounded-2xl w-full', wrapperClassName])}
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
          <ColumnHeader
            key={column.key}
            column={column}
            activeSortColumn={activeSortColumn}
            activeSortDirection={activeSortDirection}
            onSortToggle={handleSortToggle}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilter={handleClearFilter}
            openFilterColumn={openFilterColumn}
            setOpenFilterColumn={setOpenFilterColumn}
            filterOptions={resolvedFilterOptions[column.key]}
            labelClassName={labelClassName}
          />
        ))}
        {hasTrailingColumn && (
          <div aria-hidden="true" className="justify-self-end">
            {trailingHeader || null}
          </div>
        )}
      </div>

      {loading && loadingState}

      {!loading && visibleRows.length === 0 && emptyState}

      {!loading &&
        visibleRows.map((item, index) => {
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

type TableComponent = typeof TableBase & {
  Row: typeof TableRow;
};

export const Table = Object.assign(TableBase, {
  Row: TableRow,
}) as TableComponent;
