import { ArrowLeftIcon } from '@monorepo/react/icons';
import { Link } from 'react-router-dom';
import { enumDisplayDemographics } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function Header({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <>
      <div className="bg-steel-blue -mx-4 flex items-center gap-8 py-2">
        <Link to="/" className="flex items-center justify-center h-10 w-10">
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </Link>
        <h2 className="font-semibold text-white">{shelter.name}</h2>
      </div>
      {shelter.heroImage ? (
        <div className="-mx-4 mb-4">
          <img
            src={shelter.heroImage}
            alt={`hero for ${shelter.name}`}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : null}
      <h1 className="font-medium text-xl mb-2">{shelter.name}</h1>
      <div className="flex">
        <p className="text-sm">
          {shelter.demographics
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
