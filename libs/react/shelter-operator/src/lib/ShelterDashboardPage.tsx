import { useQuery } from '@apollo/client/react';
import { ShelterPage, ViewShelterDocument } from '@monorepo/react/shelter';
import { useParams } from 'react-router-dom';
import { StandardLayout } from './components/layouts/StandardLayout';

export default function Shelter() {
  const { id } = useParams();
  const { data } = useQuery(ViewShelterDocument, {
    variables: { id: id || '' },
    skip: !id,
  });

  if (!id) return null;

  const shelterName = data?.shelter?.name || undefined;

  return (
    <StandardLayout shelterName={shelterName} pageTitle="Shelter Details">
      <ShelterPage id={id} />
    </StandardLayout>
  );
}
