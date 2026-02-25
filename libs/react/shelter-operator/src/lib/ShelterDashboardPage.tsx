import { ShelterPage } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';

export default function Shelter() {
  const { id } = useParams();

  if (!id) return null;

  return <ShelterPage id={id} />;
}
