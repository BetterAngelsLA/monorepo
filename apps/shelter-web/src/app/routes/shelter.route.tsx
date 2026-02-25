import { ShelterPage } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';

export function ShelterRoute() {
  const { id } = useParams();

  if (!id) {
    console.warn('[ShelterRoute]: no id provided');

    return null;
  }

  return <ShelterPage id={id} />;
}
