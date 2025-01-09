import { Card } from '@monorepo/react/components';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function OtherServices({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter?.otherServices) return null;

  return (
    <Card title="Other Services">
      <div
        className="flex gap-1"
        dangerouslySetInnerHTML={{
          __html: shelter?.otherServices,
        }}
      />
    </Card>
  );
}
