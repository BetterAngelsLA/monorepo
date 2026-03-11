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

  const name = cells[0];
  const address = cells[1];
  const capacity = cells[2];
  const tags = cells[3];
  const hardcodedTags = ['Women Only', 'Shared', 'Pets Allowed', 'No Parking'];
  const MAX_VISIBLE_TAG_CHAR_COUNT = 15;
  const tagContent = tags?.content;
  const parsedTags = Array.isArray(tagContent)
    ? tagContent
        .map((tag) => String(tag).trim())
        .filter((tag) => Boolean(tag) && tag.toUpperCase() !== 'N/A')
    : typeof tagContent === 'string'
    ? tagContent
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => Boolean(tag) && tag.toUpperCase() !== 'N/A')
    : [];
  const tagsToShow = parsedTags.length > 0 ? parsedTags : hardcodedTags;
  let visibleCharCount = 0;
  const visibleTags = tagsToShow.filter((tag) => {
    const nextCount = visibleCharCount + tag.length;
    if (nextCount >= MAX_VISIBLE_TAG_CHAR_COUNT) return false;
    visibleCharCount = nextCount;
    return true;
  });
  const remainingTagsCount = Math.max(
    tagsToShow.length - visibleTags.length,
    0
  );

  return (
    <div
      onClick={onClick}
      className={[
        'grid items-center px-4 mx-4 py-2 text-sm border-t border-gray-200',
        'hover:bg-[#F4F6FD]',
        onClick && 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gridTemplateColumns: templateColumns, ...style }}
    >
      <div
        className={['text-left justify-self-start', name?.className ?? '']
          .join(' ')
          .trim()}
      >
        {name?.content}
      </div>

      <div
        className={['text-left justify-self-start', address?.className ?? '']
          .join(' ')
          .trim()}
      >
        {address?.content}
      </div>

      <div
        className={['text-left justify-self-start', capacity?.className ?? '']
          .join(' ')
          .trim()}
      >
        {capacity?.content}
      </div>

      <div
        className={['text-left justify-self-start', tags?.className ?? '']
          .join(' ')
          .trim()}
      >
        <div className="flex flex-wrap items-center gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]"
            >
              {tag}
            </span>
          ))}
          {remainingTagsCount > 0 && (
            <span className="rounded-full bg-[#EDEFF5] px-3 py-1 text-xs text-[#747A82]">
              +{remainingTagsCount}
            </span>
          )}
        </div>
      </div>

      <div
        className="justify-self-end"
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
