import { Card } from '@monorepo/react/components';
import { ShelterChoices } from '../../../apollo';
import { enumDisplayShelterChoices } from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';

export function ShelterTypes({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter?.shelterTypes?.length) return null;
  return (
    <Card title="Shelter Types">
      {shelter.shelterTypes
        .map((shelterType) => shelterType.name)
        .filter((name): name is ShelterChoices => !!name)
        .map((name) => enumDisplayShelterChoices[name])
        .join(', ')}
    </Card>
  );
}
