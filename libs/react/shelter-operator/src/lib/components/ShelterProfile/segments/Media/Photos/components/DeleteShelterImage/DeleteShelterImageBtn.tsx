import { mergeCss } from '@monorepo/react/shared';
import { Trash2 } from 'lucide-react';

type TProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function DeleteShelterImageBtn(props: TProps) {
  const { onClick, disabled, className } = props;

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={mergeCss([
        'text-red-500',
        'opacity-70 hover:opacity-100',
        'p-2 rounded-full hover:bg-white',
        'hover:shadow-xl',
        'cursor-pointer',
        className,
      ])}
      aria-label="Delete photo"
    >
      <Trash2 size={16} />
    </button>
  );
}
