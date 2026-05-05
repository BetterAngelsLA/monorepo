import { useQuery } from '@apollo/client/react';
import { VideoEmbed } from '@monorepo/react/components';
import { ArrowLeftIcon } from '@monorepo/react/icons';
import { mapMediaLinksToVideos } from '@monorepo/react/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaLightbox } from '../../components';
import { ViewShelterDocument } from '../shelter/__generated__/shelter.generated';

type TProps = {
  id: string;
};

export function GalleryPage(props: TProps) {
  const { id } = props;

  const { loading, data } = useQuery(ViewShelterDocument, {
    variables: { id },
  });
  const [selectedImage, setSelectedImage] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    title?: string;
  } | null>(null);

  if (loading) {
    return null;
  }

  const shelter = data?.shelter;

  if (!shelter) {
    return null;
  }

  const combinedPhotos = [...shelter.exteriorPhotos, ...shelter.interiorPhotos];
  const youtubeVideos = mapMediaLinksToVideos(shelter.mediaLinks || []);

  return (
    <>
      <div className="bg-steel-blue -mx-4 flex items-center gap-8 py-2">
        <Link
          to={`/shelter/${id}`}
          className="flex items-center justify-center h-10 w-10"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </Link>
        <h2 className="font-semibold text-white">{shelter.name} photos</h2>
      </div>
      <div className="grid grid-cols-2 gap-1 px-4 py-4">
        {combinedPhotos.map((item, index) => (
          <div
            key={index}
            className="aspect-square overflow-hidden"
            onClick={() => setSelectedImage(item.file)}
          >
            <img
              src={item.file.url}
              alt={item.file.name}
              loading="lazy"
              className="w-full h-full object-cover cursor-pointer"
            />
          </div>
        ))}
        {youtubeVideos.map((video) => (
          <div
            key={`yt-${video.videoId}`}
            className="aspect-square overflow-hidden cursor-pointer relative"
            onClick={() => setSelectedVideo(video)}
          >
            <img
              src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
              alt={video.title || 'YouTube video'}
              loading="lazy"
              className="w-full h-full object-cover"
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
        ))}
      </div>

      {selectedImage && (
        <MediaLightbox
          onClose={() => setSelectedImage(null)}
          contentClassName="w-[90vw] max-w-md aspect-square"
        >
          <img
            src={selectedImage.url}
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
