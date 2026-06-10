import { ArrowLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { VideoEmbed } from '../VideoEmbed';

type TProps = {
  videoId: string;
  title?: string;
  className?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClick?: () => void;
};

export function YouTubeSlide(props: TProps) {
  const {
    videoId,
    title = 'YouTube video',
    className,
    onPrev,
    onNext,
    onClick,
  } = props;

  const parentCss = ['flex-none', 'w-full', 'h-full', 'relative', className];

  if (onClick) {
    return (
      <div
        className={mergeCss([parentCss, 'cursor-pointer'])}
        onClick={onClick}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          loading="lazy"
          className="block w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={mergeCss(parentCss)}>
      <VideoEmbed
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        className="block w-full h-full"
      />
      {/* Transparent swipe zones on left/right edges, leaving bottom 48px clear for YouTube controls */}

      <button
        onClick={() => onPrev?.()}
        className="absolute top-1/2 -translate-y-1/2 left-[3%] w-6 h-6 flex items-center justify-center rounded-full shadow-lg bg-black/35 z-10"
      >
        <ArrowLeftIcon className="text-white w-5" />
      </button>
      <button
        onClick={() => onNext?.()}
        className="absolute top-1/2 -translate-y-1/2 right-[3%] w-6 h-6 flex items-center justify-center rounded-full shadow-lg bg-black/35 z-10"
      >
        <ArrowLeftIcon className="rotate-180 text-white w-5" />
      </button>
    </div>
  );
}
