import {
  ImageCarousel,
  TYouTubeVideo,
  VideoEmbed,
} from '@monorepo/react/components';
import { mapMediaLinksToVideos, mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { ImagePlaceholder, MediaLightbox } from '../../../../components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

type TProps = {
  shelter: ViewShelterQuery['shelter'];
  className?: string;
};

export function HeroCarousel(props: TProps) {
  const { shelter, className } = props;
  const images = [
    ...(shelter.exteriorPhotos || []),
    ...(shelter.interiorPhotos || []),
  ];

  const youtubeVideos = mapMediaLinksToVideos(shelter.mediaLinks || []);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TYouTubeVideo | null>(
    null
  );

  const parentCss = ['bg-white', 'h-[200px]', className];
  const placeholderCss = ['h-[250px]', className];

  if (!images.length && !youtubeVideos.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  const rest = images
    .map((i) => i.file?.url)
    .filter((u) => u !== shelter.heroImage);

  const imageUrls = shelter.heroImage ? [shelter.heroImage, ...rest] : rest;

  return (
    <>
      <ImageCarousel
        imageUrls={imageUrls}
        youtubeVideos={youtubeVideos}
        className={mergeCss(parentCss)}
        onImageClick={(src) => setSelectedImage(src)}
        onVideoClick={(video) => setSelectedVideo(video)}
      />

      {selectedImage && (
        <MediaLightbox
          onClose={() => setSelectedImage(null)}
          contentClassName="w-[90vw] max-w-md aspect-square"
        >
          <img
            src={selectedImage}
            alt="Fullscreen"
            className="w-full h-full object-contain"
          />
        </MediaLightbox>
      )}

      {selectedVideo && (
        <MediaLightbox onClose={() => setSelectedVideo(null)}>
          <VideoEmbed
            src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}`}
            title={selectedVideo.title || 'YouTube video'}
          />
        </MediaLightbox>
      )}
    </>
  );
}
