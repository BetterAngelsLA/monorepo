import { Card } from '@monorepo/react/components';
import { WysiwygContainer } from '../../components';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function OtherServices({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter?.otherServices) return null;

  return (
    <Card title="Other Services">
      <WysiwygContainer content={shelter.otherServices} />
    </Card>
  );
}
