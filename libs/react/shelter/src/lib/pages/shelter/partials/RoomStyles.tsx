import { Card, ExpandableContainer } from '@monorepo/react/components';
import { RoomStyleChoices } from '../../../apollo';
import { WysiwygContainer } from '../../../components';
import { displayListWithOther, enumDisplayRoomStyles } from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { InlineList } from '../common';
import { hasWysiwygContent } from '../utils';

export function RoomStyles({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter.roomStyles?.length) return null;

  const hasNotesContent = hasWysiwygContent(shelter.addNotesSleepingDetails);

  const roomStyles = displayListWithOther(
    shelter?.roomStyles as readonly { name?: RoomStyleChoices.Other | null }[],
    shelter?.roomStylesOther,
    enumDisplayRoomStyles,
    RoomStyleChoices.Other
  );

  return (
    <Card title="Sleeping Details">
      <InlineList items={roomStyles} />

      {hasNotesContent && (
        <ExpandableContainer
          header="Additional Notes"
          className="w-full mt-4"
          iconClassName="w-[8px]"
          headerClassName="min-h-6 font-semibold"
        >
          <WysiwygContainer content={shelter.addNotesSleepingDetails} />
        </ExpandableContainer>
      )}
    </Card>
  );
}
