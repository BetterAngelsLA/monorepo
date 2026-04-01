import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Button } from './base-ui/buttons';

export type RowCell = {
  key: string;
  content: ReactNode;
  className?: string;
};

export type RowClickHandler<TRowObject> = (
  rowObject: TRowObject,
  rowIndex: number
) => void;

type RowProps<TRowObject> = {
  cells: RowCell[];
  rowObject: TRowObject;
  rowIndex: number;
  templateColumns: string;
  trailingContent?: ReactNode;
  className?: string;
  rowInsetClassName?: string;
  style?: CSSProperties;
  onRowClick?: RowClickHandler<TRowObject>;
  onDelete?: (rowObject: TRowObject, rowIndex: number) => void;
};

export function Row<TRowObject>({
  cells,
  rowObject,
  rowIndex,
  templateColumns,
  trailingContent,
  className = '',
  rowInsetClassName = '',
  style,
  onRowClick,
  onDelete,
}: RowProps<TRowObject>) {
  const handleRowClick = () => {
    onRowClick?.(rowObject, rowIndex);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleRowClick();
    }
  };

  return (
    <div
      role="row"
      tabIndex={onRowClick ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={onRowClick ? handleKeyDown : undefined}
      className={[
        'grid items-center py-2 text-sm border-t border-gray-200',
        rowInsetClassName || 'px-4 mx-4',
        'hover:bg-[#F4F6FD]',
        onRowClick && 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
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
      {trailingContent && (
        <div className="justify-self-end">{trailingContent}</div>
      )}
    </div>
  );
}
