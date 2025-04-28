import { GalleryPage } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';

export default function Gallery() {
  const { id } = useParams();

  if (!id) return null;

  return <GalleryPage id={id} />;
}
