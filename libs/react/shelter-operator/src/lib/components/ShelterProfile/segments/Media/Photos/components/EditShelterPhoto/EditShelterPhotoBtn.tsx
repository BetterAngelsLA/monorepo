import { mergeCss } from '@monorepo/react/shared';
import { Pencil } from 'lucide-react';

type TProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function EditShelterPhotoBtn(props: TProps) {
  const { onClick, disabled, className } = props;

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={mergeCss([
        'text-gray-500',
        'opacity-70 hover:opacity-100',
        'p-2 rounded-full hover:bg-white',
        'hover:shadow-xl',
        'cursor-pointer',
        className,
      ])}
      aria-label="Edit photo type"
    >
      <Pencil size={16} />
    </button>
  );
}
