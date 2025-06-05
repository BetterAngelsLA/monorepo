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
} from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function EcosystemInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Ecosystem Information">
      <div className="flex flex-col gap-2">
        {!!shelter.cities.length && (
          <div className="flex items-center gap-2">
            <strong>City:</strong>{' '}
            {shelter.cities
              .filter((city): city is { name: CityChoices } => !!city.name)
              .map((city) => enumDisplayCityChoices[city.name])
              .join(', ')}
          </div>
        )}
        {!!shelter.spa.length && (
          <div className="flex items-center gap-2">
            <strong>SPA:</strong>{' '}
            {shelter.spa
              .filter((spa): spa is { name: SpaChoices } => !!spa.name)
              .map((spa) => enumDisplaySpaChoices[spa.name])
              .join(', ')}
          </div>
        )}
        {!!shelter.cityCouncilDistrict && (
          <div className="flex items-center gap-2">
            <strong>LACD:</strong> {shelter.cityCouncilDistrict}
          </div>
        )}
        {!!shelter.supervisorialDistrict && (
          <div className="flex items-center gap-2">
            <strong>SD:</strong> {shelter.supervisorialDistrict}
          </div>
        )}
        {!!shelter.shelterPrograms.length && (
          <div className="flex items-center gap-2">
            <strong>Program:</strong>{' '}
            {shelter.shelterPrograms
              .filter(
                (program): program is { name: ShelterProgramChoices } =>
                  !!program.name
              )
              .map((program) => enumDisplayShelterProgramChoices[program.name])
              .join(', ')}
          </div>
        )}
        {!!shelter.funders.length && (
          <div className="flex items-center gap-2">
            <strong>Program:</strong>{' '}
            {shelter.funders
              .filter(
                (funder): funder is { name: FunderChoices } => !!funder.name
              )
              .map((funder) => enumDisplayFunderChoices[funder.name])
              .join(', ')}
          </div>
        )}
      </div>
    </Card>
  );
}
