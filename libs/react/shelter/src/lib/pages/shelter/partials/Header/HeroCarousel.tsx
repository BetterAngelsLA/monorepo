import {
  ImageCarousel,
  TYouTubeVideo,
  VideoEmbed,
} from '@monorepo/react/components';
import { ArrowLeftIcon } from '@monorepo/react/icons';
import { mapMediaLinksToVideos, mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { ImagePlaceholder } from '../../../../components';
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
        <div className="fixed inset-0 z-400 bg-black flex flex-col h-full">
          <div className="bg-steel-blue flex items-center gap-8 py-2">
            <div
              onClick={() => setSelectedImage(null)}
              className="ml-5 flex items-center justify-center h-10 w-10 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div
            onClick={() => setSelectedImage(null)}
            className="flex flex-1 items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[90vw] max-w-md aspect-square"
            >
              <img
                src={selectedImage}
                alt="Fullscreen"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-400 bg-black flex flex-col h-full">
          <div className="bg-steel-blue flex items-center gap-8 py-2">
            <div
              onClick={() => setSelectedVideo(null)}
              className="ml-5 flex items-center justify-center h-10 w-10 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div
            onClick={() => setSelectedVideo(null)}
            className="flex flex-1 items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[90vw] max-w-md"
            >
              <VideoEmbed
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}`}
                title={selectedVideo.title || 'YouTube video'}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
