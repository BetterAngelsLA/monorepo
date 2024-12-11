// import { enumDisplayDemographics } from '@monorepo/expo/betterangels';
import { enumDisplayDemographics } from '../../static';
import { useViewShelterQuery } from './__generated__/shelter.generated';

export default function ShelterPage({ id }: { id: string }) {
  const { loading, error, data } = useViewShelterQuery({
    variables: {
      id,
    },
  });

  if (loading) return null;

  const shelter = data?.shelter;

  return (
    <div className="w-full">
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
    </div>
  );
}
