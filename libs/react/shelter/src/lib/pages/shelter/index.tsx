import { Button, Card } from '@monorepo/react/components';
import parsePhoneNumber from 'libphonenumber-js';
import { useNavigate } from 'react-router-dom';
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
import { useViewShelterQuery } from './__generated__/shelter.generated';
import { WysiwygSection } from './shared/WysiwygSection';

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

  function containsNonWhitespaceValue(value?: string | null | undefined) {
    // Rich text (CKEditor5) fields aren't empty when empty.
    // By default, they contain a non-breaking space char.
    return !!value && value !== '<p>&nbsp;</p>';
  }

  const hasGeneralInfo =
    !!shelter.totalBeds ||
    !!shelter.website ||
    !!shelter.phone ||
    !!shelter.email ||
    !!shelter.location?.place;
  const hasDescription = containsNonWhitespaceValue(shelter.description);
  const hasEntryRequirements =
    !!shelter.entryRequirements?.length ||
    containsNonWhitespaceValue(shelter.entryInfo) ||
    containsNonWhitespaceValue(shelter.bedFees) ||
    containsNonWhitespaceValue(shelter.programFees);
  const hasSpecialRestrictions = !!shelter.specialSituationRestrictions?.length;
  const hasShelterTypes =
    !!shelter.shelterTypes?.length || !!shelter.shelterTypesOther;
  const hasRoomStyles = !!shelter.roomStyles?.length;
  const hasDetail =
    !!shelter.accessibility?.length ||
    !!shelter.storage?.length ||
    !!shelter.pets?.length ||
    !!shelter.parking?.length;
  const hasRestrictions =
    !!shelter.maxStay ||
    !!shelter.curfew ||
    !!shelter.onSiteSecurity ||
    containsNonWhitespaceValue(shelter.otherRules);
  const hasOtherServices = containsNonWhitespaceValue(shelter.otherServices);
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
      <Actions
        phone={parsePhoneNumber(shelter.phone ?? '', 'US')?.formatNational()}
        shelterName={shelter.name}
      />
      <div className="bg-neutral-99 py-2 px-4 -mx-4 flex flex-col gap-2">
        {hasGeneralInfo && <GeneralInfo shelter={shelter} />}
        {hasDescription && (
          <Card title="Description">
            <WysiwygSection content={shelter.description} />
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
