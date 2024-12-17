import { Card } from '@monorepo/react/components';
import { ShelterChoices } from '../../apollo';
import { enumDisplayShelterChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function ShelterTypes({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter?.shelterTypes?.length) return null;
  return (
    <Card title="Shelter Types">
      {shelter.shelterTypes
        .filter(
          (shelterType): shelterType is { name: ShelterChoices } =>
            !!shelterType.name
        )
        .map((shelterType) => enumDisplayShelterChoices[shelterType.name])
        .join(', ')}
    </Card>
  );
}
