import { Card } from '@monorepo/react/components';
import {
  CityChoices,
  FunderChoices,
  ShelterProgramChoices,
  SpaChoices,
} from '../../apollo';
import {
  enumDisplayCityChoices,
  enumDisplayFunderChoices,
  enumDisplayShelterProgramChoices,
  enumDisplaySpaChoices,
  formatCityCouncilDistrict,
} from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';
import { InlineList } from './shared/InlineList';

export default function EcosystemInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Ecosystem Information">
      <div className="flex flex-col gap-2">
        <InlineList
          title="City:"
          items={shelter?.cities.map(
            (i) => enumDisplayCityChoices[i.name as CityChoices]
          )}
        />

        <InlineList
          title="SPA:"
          items={shelter?.spa.map(
            (i) => enumDisplaySpaChoices[i.name as SpaChoices]
          )}
        />

        {shelter.cityCouncilDistrict != null && (
          <div className="flex items-center gap-2">
            <strong>LACD:</strong>{' '}
            {formatCityCouncilDistrict(shelter.cityCouncilDistrict)}
          </div>
        )}

        {!!shelter.supervisorialDistrict && (
          <div className="flex items-center gap-2">
            <strong>SD:</strong> {shelter.supervisorialDistrict}
          </div>
        )}

        <InlineList
          title="Program:"
          items={shelter?.shelterPrograms.map(
            (i) =>
              enumDisplayShelterProgramChoices[i.name as ShelterProgramChoices]
          )}
        />

        <InlineList
          title="Funders:"
          items={shelter?.funders.map(
            (i) => enumDisplayFunderChoices[i.name as FunderChoices]
          )}
        />
      </div>
    </Card>
  );
}
