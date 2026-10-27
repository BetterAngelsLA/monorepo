import { mergeCss } from '@monorepo/react/shared';
import { Play } from 'lucide-react';

type TProps = {
  videoId: string;
  title?: string;
  onClick?: () => void;
  className?: string;
};

/**
 * Clickable YouTube video thumbnail with a play overlay. Purely presentational —
 * the caller decides what happens on click (inline player, modal, navigation).
 *
 * Uses `mqdefault.jpg` (320×180) so a table full of thumbnails stays cheap.
 */
export function YouTubeThumbnail(props: TProps) {
  const { videoId, title, onClick, className } = props;

  const label = title || 'YouTube video';

  const parentCss = [
    'group',
    'relative',
    'w-24',
    'aspect-video',
    'rounded',
    'overflow-hidden',
    'bg-gray-100',
    'border-none',
    'p-0',
    'cursor-pointer',
  ];

  const overlayCss = [
    'absolute',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'bg-black/20',
    'group-hover:bg-black/40',
    'transition-colors',
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Play ${label}`}
      className={mergeCss([parentCss, className])}
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt={label}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <span aria-hidden="true" className={mergeCss(overlayCss)}>
        <Play size={20} className="text-white fill-white" />
      </span>
    </button>
  );
}
