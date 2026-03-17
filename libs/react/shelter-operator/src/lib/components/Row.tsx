import type { CSSProperties, ReactNode } from 'react';
import { Button } from './base-ui/buttons/buttons';

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
  style?: CSSProperties;
  onRowClick?: RowClickHandler<TRowObject>;
  onClick?: () => void;
};

export function Row<TRowObject>({
  cells,
  rowObject,
  rowIndex,
  templateColumns,
  trailingContent,
  className = '',
  style,
  onRowClick,
  onClick,
}: RowProps<TRowObject>) {
  const handleRowClick = () => {
    console.log('[ShelterOperator][Row click]', rowObject);
    onRowClick?.(rowObject, rowIndex);
    onClick?.();
  };

  return (
    <div
      onClick={handleRowClick}
      className={[
        'grid items-center px-4 mx-4 py-2 text-sm border-t border-gray-200',
        'hover:bg-[#F4F6FD]',
        (onRowClick || onClick) && 'cursor-pointer',
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

      <div className="justify-self-end">
        {trailingContent ?? <Button variant="trash" />}
      </div>
    </div>
  );
}
