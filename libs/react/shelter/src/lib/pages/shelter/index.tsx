import { Button, Card } from '@monorepo/react/components';
import { useViewShelterQuery } from './__generated__/shelter.generated';
import Actions from './Actions';
import EcosystemInfo from './EcosystemInfo';
import EntryRequirements from './EntryRequirements';
import GeneralInfo from './GeneralInfo';
import Header from './Header';
import OperationHours from './OperationHours';
import OtherServices from './OtherServices';
import Restrictions from './Restrictions';
import RoomStyles from './RoomStyles';
import ShelterDetail from './ShelterDetail';
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

  if (!shelter) {
    return null;
  }

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
          <Card title="Description">
            <div dangerouslySetInnerHTML={{ __html: shelter.description }} />
          </Card>
        )}
        <EntryRequirements shelter={shelter} />
        <SpecialRestrictions shelter={shelter} />
        <ShelterTypes shelter={shelter} />
        <RoomStyles shelter={shelter} />
        <ShelterDetail shelter={shelter} />
        <Restrictions shelter={shelter} />
        <OtherServices shelter={shelter} />
        <EcosystemInfo shelter={shelter} />
      </div>
    </div>
  );
}
