import { useQuery } from '@apollo/client/react';
import { Button, Card } from '@monorepo/react/components';
import { format } from 'date-fns';
import parsePhoneNumber from 'libphonenumber-js';
import { useNavigate } from 'react-router-dom';
import { ViewShelterDocument } from './__generated__/shelter.generated';
import { WysiwygSection } from './common';
import {
  Actions,
  EcosystemInfo,
  EntryRequirements,
  GeneralInfo,
  Header,
  OperatingHours,
  ReportUpdateButton,
  Restrictions,
  RoomStyles,
  Services,
  ShelterDetail,
  ShelterTypes,
  SpecialSituationRestrictions,
} from './partials';
import { getShelterVisibility } from './utils';

export function ShelterPage({ id }: { id: string }) {
  const { loading, data } = useQuery(ViewShelterDocument, {
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

  const visibility = getShelterVisibility(shelter);

  return (
    <div className="w-full">
      <Header shelter={shelter} />
      <OperatingHours schedules={shelter.schedules} />
      {visibility.media && (
        <Button
          onClick={() => navigate(`/shelter/${id}/gallery`)}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          See all photos
        </Button>
      )}
      <Actions
        location={shelter.location}
        phone={parsePhoneNumber(shelter.phone ?? '', 'US')?.formatNational()}
        shelterName={shelter.name}
      />
      <div className="bg-neutral-99 py-2 px-4 -mx-4 -mb-6 flex flex-col gap-2">
        <div className="text-sm text-gray-400 text-right">
          Last Updated Date: {format(shelter.updatedAt, 'M/d/yy')}
        </div>
        {visibility.generalInfo && <GeneralInfo shelter={shelter} />}
        {visibility.services && <Services shelter={shelter} />}
        {visibility.description && (
          <Card title="Description">
            <WysiwygSection content={shelter.description} />
          </Card>
        )}
        {visibility.entryRequirements && (
          <EntryRequirements shelter={shelter} />
        )}
        {visibility.specialRestrictions && (
          <SpecialSituationRestrictions shelter={shelter} />
        )}
        {visibility.shelterTypes && <ShelterTypes shelter={shelter} />}
        {visibility.roomStyles && <RoomStyles shelter={shelter} />}
        {visibility.shelterDetail && <ShelterDetail shelter={shelter} />}
        {visibility.restrictions && <Restrictions shelter={shelter} />}
        {visibility.ecosystemInfo && <EcosystemInfo shelter={shelter} />}
        <div className="my-4 flex justify-center">
          <ReportUpdateButton />
        </div>
      </div>
    </div>
  );
}
