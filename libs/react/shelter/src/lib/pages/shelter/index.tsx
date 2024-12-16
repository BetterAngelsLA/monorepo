import { Button, CardWrapper } from '@monorepo/react/components';
import { useViewShelterQuery } from './__generated__/shelter.generated';
import Actions from './Actions';
import EntryRequirements from './EntryRequirements';
import GeneralInfo from './GeneralInfo';
import Header from './Header';
import OperationHours from './OperationHours';
import RoomStyles from './RoomStyles';
import ShelterTypes from './ShelterTypes';
import SpecialRestrictions from './SpecialRestrictions';

export default function ShelterPage({ id }: { id: string }) {
  const { loading, data } = useViewShelterQuery({
    variables: {
      id,
    },
  });

  if (loading) return null;

  const shelter = data?.shelter;

  return (
    <div className="w-full">
      <Header shelter={shelter} />
      <OperationHours />
      <Button variant="secondary" size="sm" className="w-full">
        See all photos
      </Button>
      <Actions />
      <div className="bg-neutral-99 py-2 px-4 -mx-4 flex flex-col gap-2">
        <GeneralInfo shelter={shelter} />
        {shelter?.description && (
          <CardWrapper title="Description">
            <div dangerouslySetInnerHTML={{ __html: shelter.description }} />
          </CardWrapper>
        )}
        <EntryRequirements shelter={shelter} />
        <SpecialRestrictions shelter={shelter} />
        <ShelterTypes shelter={shelter} />
        <RoomStyles shelter={shelter} />
      </div>
    </div>
  );
}
