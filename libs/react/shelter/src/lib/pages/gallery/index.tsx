import { ArrowLeftIcon } from '@monorepo/react/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewShelterQuery } from '../shelter/__generated__/shelter.generated';

export default function GalleryPage({ id }: { id: string }) {
  const { loading, data } = useViewShelterQuery({
    variables: {
      id,
    },
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) return null;

  const shelter = data?.shelter;
  console.log('log', shelter?.exteriorPhotos);

  if (!shelter) {
    return null;
  }

  return (
    <>
      {selectedImage ? (
        <div
          className="fixed z-50 w-full h-full h-0 l-0 bg-black"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-steel-blue flex items-center gap-8 py-2">
            <div
              onClick={() => setSelectedImage(null)}
              className="flex items-center justify-center h-10 w-10"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold text-white">{shelter.name} photos</h2>
          </div>
          <div className="w-[90vw] max-w-md aspect-square">
            <img
              src={selectedImage}
              alt="Fullscreen"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      ) : (
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
          <div className="grid grid-cols-2 gap-1 px-4 py-2">
            {shelter.exteriorPhotos.map((item, index) => (
              <img
                onClick={() => setSelectedImage(item.file.url)}
                key={index}
                src={item.file.url}
                alt={`${item.file.name}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
