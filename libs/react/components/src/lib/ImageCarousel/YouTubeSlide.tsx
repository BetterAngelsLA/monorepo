import { ArrowLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  videoId: string;
  title?: string;
  className?: string;
  onPrev?: () => void;
  onNext?: () => void;
};

export function YouTubeSlide(props: TProps) {
  const { videoId, title = 'YouTube video', className, onPrev, onNext } = props;

  const parentCss = ['flex-none', 'w-full', 'h-full', 'relative', className];

  return (
    <div className={mergeCss(parentCss)}>
      <iframe
        className="block w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      {/* Transparent swipe zones on left/right edges, leaving bottom 48px clear for YouTube controls */}

      <button
        onClick={onPrev}
        className="absolute top-1/2 -translate-y-1/2 left-[3%] w-6 h-6 flex items-center justify-center rounded-full shadow-lg bg-black/35 z-10"
      >
        <ArrowLeftIcon className="text-white w-5" />
      </button>
      <button
        onClick={onNext}
        className="absolute top-1/2 -translate-y-1/2 right-[3%] w-6 h-6 flex items-center justify-center rounded-full shadow-lg bg-black/35 z-10"
      >
        <ArrowLeftIcon className="rotate-180 text-white w-5" />
      </button>
    </div>
  );
}
