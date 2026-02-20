import { useQuery } from '@apollo/client/react';
import { ArrowLeftIcon } from '@monorepo/react/icons';
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

  if (loading) {
    return null;
  }

  const shelter = data?.shelter;

  if (!shelter) {
    return null;
  }

  const combinedPhotos = [...shelter.exteriorPhotos, ...shelter.interiorPhotos];

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
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col  h-full">
          <div className="bg-steel-blue flex items-center gap-8 py-2">
            <div
              onClick={() => setSelectedImage(null)}
              className="ml-5 flex items-center justify-center h-10 w-10"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </div>
            {/* TODO: define name */}
            {/* <h2 className="font-semibold text-white">{selectedImage.name}</h2> */}
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
    </>
  );
}
