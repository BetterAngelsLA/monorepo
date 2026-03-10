import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, ButtonVariant } from './base-ui/buttons';

export type RowCell = {
  key: string;
  content: ReactNode;
  className?: string;
};

type RowProps = {
  cells: RowCell[];
  templateColumns: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Row({
  cells,
  templateColumns,
  className = '',
  style,
  onClick,
}: RowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  let variant: ButtonVariant = 'trash-light';

  if (isPressed) {
    variant = 'trash-dark';
  } else if (isHovered) {
    variant = 'trash-medium';
  }

  const c0 = cells[0];
  const c1 = cells[1];
  const c2 = cells[2];
  const c3 = cells[3];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={[
        'grid items-center px-2 mx-4 py-4 text-sm border-t border-gray-200',
        isHovered && 'bg-gray-50',
        onClick && 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gridTemplateColumns: templateColumns, ...style }}
    >
      <div
        className={['text-left justify-self-start', c0?.className ?? '']
          .join(' ')
          .trim()}
      >
        {c0?.content}
      </div>

      <div
        className={['text-left justify-self-start', c1?.className ?? '']
          .join(' ')
          .trim()}
      >
        {c1?.content}
      </div>

      <div
        className={['text-left justify-self-start', c2?.className ?? '']
          .join(' ')
          .trim()}
      >
        {c2?.content}
      </div>

      <div
        className={['text-left justify-self-start', c3?.className ?? '']
          .join(' ')
          .trim()}
      >
        {c3?.content}
      </div>

      <div className="justify-self-end">
        <Button
          variant={variant}
          leftIcon={<Trash2 size={20} stroke="#CB0808" />}
          rightIcon={null}
        />
      </div>
    </div>
  );
}
