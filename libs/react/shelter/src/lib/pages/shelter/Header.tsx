import { enumDisplayDemographics } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function Header({
  shelter,
}: {
  shelter?: ViewShelterQuery['shelter'];
}) {
  return (
    <>
      <h2 className="font-semibold text-white">{shelter?.name}</h2>
      <h1 className="font-medium text-xl mb-2">{shelter?.name}</h1>
      <div className="flex">
        <p className="text-sm">
          {shelter?.demographics
            ?.map((demographic) =>
              demographic.name ? enumDisplayDemographics[demographic.name] : ''
            )
            .join(', ')
            .replace(/,([^,]*)$/, ' and$1')}
        </p>
      </div>
    </>
  );
}
