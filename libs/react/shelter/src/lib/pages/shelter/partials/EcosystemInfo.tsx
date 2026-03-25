import { Card } from '@monorepo/react/components';
import {
  FunderChoices,
  ShelterProgramChoices,
  SpaChoices,
} from '../../../apollo';
import {
  displayListWithOther,
  enumDisplayFunderChoices,
  enumDisplayShelterProgramChoices,
  enumDisplaySpaChoices,
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
        <InlineList title="City:" items={shelter?.cities.map((i) => i.name)} />

        <InlineList
          title="SPA:"
          items={shelter?.spa.map(
            (i) => enumDisplaySpaChoices[i.name as SpaChoices]
          )}
        />

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
