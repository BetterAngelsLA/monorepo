import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  src: string;
  title?: string;
  className?: string;
};

export function VideoEmbed(props: TProps) {
  const { src, title = 'Video', className } = props;

  const parentCss = ['w-full', 'aspect-video', className];

  return (
    <iframe
      className={mergeCss(parentCss)}
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  );
}
