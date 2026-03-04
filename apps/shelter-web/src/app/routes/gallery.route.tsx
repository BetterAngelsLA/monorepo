import { GalleryPage } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';

export function GalleryRoute() {
  const { id } = useParams();

  if (!id) {
    console.warn('[GalleryRoute]: no id provided');

    return null;
  }

  return <GalleryPage id={id} />;
}
