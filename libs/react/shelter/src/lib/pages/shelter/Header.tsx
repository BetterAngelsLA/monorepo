import { ArrowLeftIcon, UsersIcon } from '@monorepo/react/icons';
import { Link } from 'react-router-dom';
import { enumDisplayDemographics } from '../../static';
import { HeroCarousel } from './HeroCarousel';
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
      <HeroCarousel className="-mx-4 mb-4" shelter={shelter} />
      <div className="mb-4">
        <h1 className="font-medium text-xl mb-2">{shelter.name}</h1>
        {shelter.organization && (
          <p className="text-sm mb-4">{'By ' + shelter.organization.name}</p>
        )}
      </div>
      <div className="flex gap-2 items-center mb-6">
        <UsersIcon className="w-6 h-6 fill-primary-20" />
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
