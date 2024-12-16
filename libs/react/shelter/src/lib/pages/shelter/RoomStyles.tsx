import { CardWrapper } from '@monorepo/react/components';
import { RoomStyleChoices } from '../../apollo';
import { enumDisplayRoomStyles } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function RoomStyles({
  shelter,
}: {
  shelter?: ViewShelterQuery['shelter'];
}) {
  if (!shelter?.roomStyles?.length) return null;
  return (
    <CardWrapper title="Sleeping Details">
      {shelter.roomStyles
        .filter(
          (shelterType): shelterType is { name: RoomStyleChoices } =>
            !!shelterType.name
        )
        .map((shelterType) => enumDisplayRoomStyles[shelterType.name])
        .join(', ')}
    </CardWrapper>
  );
}
