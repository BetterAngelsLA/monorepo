import { Card } from '@monorepo/react/components';
import { FunderChoices, ShelterProgramChoices } from '../../../apollo';
import {
  displayListWithOther,
  enumDisplayFunderChoices,
  enumDisplayShelterProgramChoices,
  formatCityCouncilDistrict,
} from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { InlineList } from '../common';

export function EcosystemInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const cityCouncilDistrict = formatCityCouncilDistrict(
    shelter.cityCouncilDistrict
  );

  const funderItems = displayListWithOther(
    shelter?.funders as readonly { name?: FunderChoices.Other | null }[],
    shelter?.fundersOther,
    enumDisplayFunderChoices,
    FunderChoices.Other
  );

  const shelterPrograms = displayListWithOther(
    shelter?.shelterPrograms as readonly {
      name?: ShelterProgramChoices.Other | null;
    }[],
    shelter?.shelterProgramsOther,
    enumDisplayShelterProgramChoices,
    ShelterProgramChoices.Other
  );

  return (
    <Card title="Ecosystem Information">
      <div className="flex flex-col gap-2">
        {shelter.city && (
          <div className="flex items-center gap-2">
            <strong>City:</strong> {shelter.city.name}
          </div>
        )}
        {shelter.spa && (
          <div className="flex items-center gap-2">
            <strong>SPA:</strong> {shelter.spa.name}
          </div>
        )}

        {cityCouncilDistrict && (
          <div className="flex items-center gap-2">
            <strong>LACD:</strong> {cityCouncilDistrict}
          </div>
        )}

        {!!shelter.supervisorialDistrict && (
          <div className="flex items-center gap-2">
            <strong>SD:</strong> {shelter.supervisorialDistrict}
          </div>
        )}

        <InlineList title="Program:" items={shelterPrograms} />

        <InlineList title="Funders:" items={funderItems} />
      </div>
    </Card>
  );
}
