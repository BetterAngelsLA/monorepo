import { useQuery } from '@apollo/client/react';
import { ArrowLeftIcon } from '@monorepo/react/icons';
import { extractYouTubeVideoId } from '@monorepo/react/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    title: string;
  } | null>(null);

  if (loading) {
    return null;
  }

  const shelter = data?.shelter;

  if (!shelter) {
    return null;
  }

  const combinedPhotos = [...shelter.exteriorPhotos, ...shelter.interiorPhotos];
  const youtubeVideos = (shelter.youtubeLinks || [])
    .map((link) => {
      const videoId = extractYouTubeVideoId(link.url);
      return videoId ? { videoId, title: link.title || '' } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

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
        {youtubeVideos.map((video, index) => (
          <div
            key={`yt-${index}`}
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
        <div className="fixed inset-0 z-400 bg-black flex flex-col h-full">
          <div className="bg-steel-blue flex items-center gap-8 py-2">
            <div
              onClick={() => setSelectedImage(null)}
              className="ml-5 flex items-center justify-center h-10 w-10"
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
                src={selectedImage.url}
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
              className="ml-5 flex items-center justify-center h-10 w-10"
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
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}`}
                title={selectedVideo.title || 'YouTube video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
