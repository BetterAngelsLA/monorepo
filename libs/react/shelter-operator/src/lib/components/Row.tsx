import type { CSSProperties, ReactNode } from 'react';

type CellAlign = 'left' | 'center' | 'right';

export type RowCell = {
  key: string;
  content: ReactNode;
  align?: CellAlign;
  className?: string;
};

type RowProps = {
  cells: RowCell[];
  templateColumns: string;
  className?: string;
  style?: CSSProperties;
};

function getAlignmentClass(align: CellAlign = 'left'): string {
  if (align === 'right') return 'text-right justify-self-end';
  if (align === 'center') return 'text-center justify-self-center';
  return 'text-left justify-self-start';
}

export function Row({
  cells,
  templateColumns,
  className = '',
  style,
}: RowProps) {
  return (
    <div
      className={[
        'grid items-center px-6 py-4 text-sm border-b border-gray-200 hover:bg-gray-50',
        className,
      ].join(' ')}
      style={{ gridTemplateColumns: templateColumns, ...style }}
    >
      {cells.map((cell) => (
        <div
          key={cell.key}
          className={[getAlignmentClass(cell.align), cell.className ?? '']
            .join(' ')
            .trim()}
        >
          {cell.content}
        </div>
      ))}
    </div>
  );
}
