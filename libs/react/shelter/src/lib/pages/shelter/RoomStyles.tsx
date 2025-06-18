import { Card, ExpandableContainer } from '@monorepo/react/components';
import { RoomStyleChoices } from '../../apollo';
import { WysiwygContainer } from '../../components';
import { enumDisplayRoomStyles } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';
import { InlineList } from './shared/InlineList';
import { hasWysiwygContent } from './shared/hasWysiwygContent';

export default function RoomStyles({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter.roomStyles?.length) return null;

  const hasNotesContent = hasWysiwygContent(shelter.addNotesSleepingDetails);

  return (
    <Card title="Sleeping Details">
      <InlineList
        items={shelter.roomStyles.map(
          (i) => enumDisplayRoomStyles[i.name as RoomStyleChoices]
        )}
      />

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
