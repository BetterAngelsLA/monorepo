import { mergeCss } from '@monorepo/react/shared';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Button } from './base-ui/buttons';

export type TableRowCell = {
  key: string;
  content: ReactNode;
  className?: string;
};

export type TableRowClickHandler<TRowObject> = (
  rowObject: TRowObject,
  rowIndex: number
) => void;

export type TableRowProps<TRowObject> = {
  cells: TableRowCell[];
  rowObject: TRowObject;
  rowIndex: number;
  templateColumns: string;
  slot?: ReactNode;
  trailingContent?: ReactNode;
  className?: string;
  rowInsetClassName?: string;
  style?: CSSProperties;
  onRowClick?: TableRowClickHandler<TRowObject>;
  onDelete?: (rowObject: TRowObject, rowIndex: number) => void;
};

type TableRowSlotProps = {
  children: ReactNode;
  className?: string;
};

export function TableRowSlot({ children, className }: TableRowSlotProps) {
  return (
    <div className={mergeCss(['justify-self-end', className])}>{children}</div>
  );
}

const TableRowBase = <TRowObject,>({
  cells,
  rowObject,
  rowIndex,
  templateColumns,
  slot,
  trailingContent,
  className,
  rowInsetClassName,
  style,
  onRowClick,
  onDelete,
}: TableRowProps<TRowObject>) => {
  const handleRowClick = () => {
    onRowClick?.(rowObject, rowIndex);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleRowClick();
    }
  };

  const resolvedSlot = slot ?? trailingContent;

  return (
    <div
      role="row"
      tabIndex={onRowClick ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={onRowClick ? handleKeyDown : undefined}
      className={mergeCss([
        'grid items-center py-2 text-sm border-t border-gray-200',
        'px-4 mx-4',
        rowInsetClassName,
        'hover:bg-[#F4F6FD]',
        onRowClick && 'cursor-pointer',
        className,
      ])}
      style={{ gridTemplateColumns: templateColumns, ...style }}
    >
      {cells.map((cell) => (
        <div
          role="cell"
          key={cell.key}
          className={['text-left justify-self-start', cell.className ?? '']
            .join(' ')
            .trim()}
        >
          {cell.content}
        </div>
      ))}

      {onDelete && !trailingContent && (
        <div
          className="justify-self-end"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(rowObject, rowIndex);
          }}
        >
          <Button variant="trash" />
        </div>
      )}
      {resolvedSlot && <TableRowSlot>{resolvedSlot}</TableRowSlot>}
    </div>
  );
};

type TableRowComponent = (<TRowObject>(
  props: TableRowProps<TRowObject>
) => JSX.Element) & {
  Slot: typeof TableRowSlot;
};

export const TableRow = Object.assign(TableRowBase, {
  Slot: TableRowSlot,
}) as TableRowComponent;

// Backward-compatible aliases while callers migrate to TableRow naming.
export const Row = TableRow;
export type RowCell = TableRowCell;
export type RowClickHandler<TRowObject> = TableRowClickHandler<TRowObject>;
