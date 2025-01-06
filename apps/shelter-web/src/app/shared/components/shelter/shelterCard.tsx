import { LocationIcon } from '@monorepo/react/icons';
import { useNavigate } from 'react-router-dom';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TLatLng } from '../map/types.maps';
import { DistanceAway } from './distanceAway';

export type TShelterLocation = {
  latitude: number;
  longitude: number;
  place: string;
};

export type TShelter = {
  id: string;
  name: string;
  heroImage?: string | null;
  distanceInMiles?: number | null;
  location?: TShelterLocation | null;
};

type TShelterCard = {
  className?: string;
  shelter: TShelter;
  originCoordinates?: TLatLng | null;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: { id, name, heroImage, distanceInMiles, location },
    originCoordinates,
    className,
  } = props;

  const navigate = useNavigate();

  const formattedAddress = location?.place.replace(/, USA$/, '');

  const parentCss = [
    'flex',
    'flex-col',
    'md:flex-row',
    'cursor-pointer',
    className,
  ];

  const heroCss = ['md:w-96', 'md:mr-4'];

  const contentCss = ['mt-4'];

  return (
    <div
      className={mergeCss(parentCss)}
      onClick={() => navigate(`/shelter/${id}`)}
    >
      {heroImage && (
        <div className={mergeCss(heroCss)}>
          <img
            src={heroImage}
            alt={`hero for ${name}`}
            loading="lazy"
            className="aspect-[4/3] rounded-[20px]"
          />
        </div>
      )}

      <div className={mergeCss(contentCss)}>
        <div className="font-semibold text-sm md:text-lg leading-[1.125rem] tracking-[.03125rem]">
          {name}
        </div>

        {formattedAddress && (
          <div className="text-xs md:text-sm mt-1.5 flex items-start">
            <LocationIcon className="h-4 mr-2" />

            <div className="flex-inline flex-wrap">
              <span>{formattedAddress}</span>

              <DistanceAway
                className="ml-1 inline"
                distanceInMiles={distanceInMiles}
                originCoordinates={originCoordinates}
                targetCoordinates={location}
                formatFn={(distance) => `(${distance} away)`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
