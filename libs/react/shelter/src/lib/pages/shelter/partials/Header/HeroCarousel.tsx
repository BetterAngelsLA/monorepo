import {
  ImageCarousel,
  TYouTubeVideo,
  VideoEmbed,
} from '@monorepo/react/components';
import { mapMediaLinksToVideos, mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { groupBy } from 'remeda';
import { ShelterPhotoTypeChoices } from '../../../../apollo/graphql/__generated__/types';
import { ImagePlaceholder, MediaLightbox } from '../../../../components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

type TProps = {
  shelter: ViewShelterQuery['shelter'];
  className?: string;
};

export function HeroCarousel(props: TProps) {
  const { shelter, className } = props;
  const heroImage = shelter.heroImage;
  const heroId = heroImage?.id;

  const nonHeroPhotos = shelter.photos.filter((p) => p.id !== heroId);
  const photosByType = groupBy(nonHeroPhotos, (p) => p.type);

  const imageUrls = [
    ...(heroImage?.url ? [heroImage.url] : []),
    ...(photosByType[ShelterPhotoTypeChoices.Exterior] ?? []).map(
      (p) => p.file.url
    ),
    ...(photosByType[ShelterPhotoTypeChoices.Interior] ?? []).map(
      (p) => p.file.url
    ),
  ].filter((u): u is string => Boolean(u));

  const youtubeVideos = mapMediaLinksToVideos(shelter.mediaLinks || []);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TYouTubeVideo | null>(
    null
  );

  const parentCss = ['bg-white', 'h-[200px]', className];
  const placeholderCss = ['h-[250px]', className];

  if (!imageUrls.length && !youtubeVideos.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

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
