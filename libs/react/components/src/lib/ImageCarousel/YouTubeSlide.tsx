import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  videoId: string;
  title?: string;
  className?: string;
};

export function YouTubeSlide(props: TProps) {
  const { videoId, title = 'YouTube video', className } = props;

  const parentCss = ['flex-none', 'w-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <iframe
        className="block w-full aspect-4/3"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
