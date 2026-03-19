import type { CSSProperties, ReactNode } from 'react';
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
  className?: string;
  style?: CSSProperties;
  onRowClick?: RowClickHandler<TRowObject>;
  onDelete?: (rowObject: TRowObject, rowIndex: number) => void;
};

export function Row<TRowObject>({
  cells,
  rowObject,
  rowIndex,
  templateColumns,
  className = '',
  style,
  onRowClick,
  onDelete,
}: RowProps<TRowObject>) {
  const handleRowClick = () => {
    onRowClick?.(rowObject, rowIndex);
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        'grid items-center px-4 mx-4 py-2 text-sm border-t border-gray-200',
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
          key={cell.key}
          className={['text-left justify-self-start', cell.className ?? '']
            .join(' ')
            .trim()}
        >
          {cell.content}
        </div>
      ))}

      {onDelete && (
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
    </div>
  );
}
