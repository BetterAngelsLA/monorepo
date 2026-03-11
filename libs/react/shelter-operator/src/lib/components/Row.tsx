import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, ButtonVariant } from './base-ui/buttons';

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
  onClick?: () => void;
};

export function Row<TRowObject>({
  cells,
  rowObject,
  rowIndex,
  templateColumns,
  className = '',
  style,
  onRowClick,
  onClick,
}: RowProps<TRowObject>) {
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isDeletePressed, setIsDeletePressed] = useState(false);

  let variant: ButtonVariant = 'trash-light';

  if (isDeletePressed) {
    variant = 'trash-dark';
  } else if (isDeleteHovered) {
    variant = 'trash-medium';
  }

  const deleteIconStroke =
    isDeleteHovered || isDeletePressed ? '#CB0808' : '#747A82';

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

      <div
        className="justify-self-end"
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={() => setIsDeleteHovered(true)}
        onMouseLeave={() => {
          setIsDeleteHovered(false);
          setIsDeletePressed(false);
        }}
        onMouseDown={() => setIsDeletePressed(true)}
        onMouseUp={() => setIsDeletePressed(false)}
      >
        <Button
          variant={variant}
          leftIcon={<Trash2 size={20} stroke={deleteIconStroke} />}
          rightIcon={false}
        />
      </div>
    </div>
  );
}
