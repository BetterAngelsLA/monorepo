import { Button, Card } from '@monorepo/react/components';
import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  if (loading) return null;

  const shelter = data?.shelter;

  if (!shelter) {
    return null;
  }

  const hasGeneralInfo =
    !!shelter.totalBeds ||
    !!shelter.website ||
    !!shelter.phone ||
    !!shelter.email ||
    !!shelter.location?.place;
  const hasDescription = !!shelter.description;
  const hasEntryRequirements =
    !!shelter.entryRequirements?.length ||
    !!shelter.entryInfo ||
    !!shelter.bedFees ||
    !!shelter.programFees;
  const hasSpecialRestrictions = !!shelter.specialSituationRestrictions?.length;
  const hasShelterTypes = !!shelter.shelterTypes?.length;
  const hasRoomStyles = !!shelter.roomStyles?.length;
  const hasDetail =
    !!shelter.accessibility ||
    !!shelter.storage ||
    !!shelter.pets ||
    !!shelter.parking;
  const hasRestrictions =
    !!shelter.maxStay ||
    !!shelter.curfew ||
    !!shelter.onSiteSecurity ||
    !!shelter.otherRules;
  const hasOtherServices = !!shelter.otherServices;
  const hasEcosystemInfo =
    !!shelter.cities?.length ||
    !!shelter.spa?.length ||
    !!shelter.cityCouncilDistrict ||
    !!shelter.supervisorialDistrict ||
    !!shelter.shelterPrograms?.length ||
    !!shelter.funders?.length;

  return (
    <div className="w-full">
      <Header shelter={shelter} />
      <OperationHours />
      <Button
        onClick={() => navigate(`/shelter/${id}/gallery`)}
        variant="secondary"
        size="sm"
        className="w-full"
      >
        See all photos
      </Button>
      <Actions />
      <div className="bg-neutral-99 py-2 px-4 -mx-4 flex flex-col gap-2">
        {hasGeneralInfo && <GeneralInfo shelter={shelter} />}
        {hasDescription && (
          <Card title="Description">
            <div dangerouslySetInnerHTML={{ __html: shelter.description }} />
          </Card>
        )}
        {hasEntryRequirements && <EntryRequirements shelter={shelter} />}
        {hasSpecialRestrictions && <SpecialRestrictions shelter={shelter} />}
        {hasShelterTypes && <ShelterTypes shelter={shelter} />}
        {hasRoomStyles && <RoomStyles shelter={shelter} />}
        {hasDetail && <ShelterDetail shelter={shelter} />}
        {hasRestrictions && <Restrictions shelter={shelter} />}
        {hasOtherServices && <OtherServices shelter={shelter} />}
        {hasEcosystemInfo && <EcosystemInfo shelter={shelter} />}
      </div>
    </div>
  );
}
