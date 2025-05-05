import { LocationIcon } from '@monorepo/react/icons';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TLatLng } from '../map/types.maps';
import { DistanceAway } from './distanceAway';
import { ShelterCardHero } from './shelterCardHero';

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
  onClick?: () => void;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: { id, name, heroImage, distanceInMiles, location },
    originCoordinates,
    onClick,
    className,
  } = props;

  const formattedAddress = location?.place.replace(/, USA$/, '');

  const parentCss = [
    'flex',
    'flex-col',
    'md:flex-row',
    'cursor-pointer',
    className,
  ];

  const contentCss = ['mt-4'];

  return (
    <div className={mergeCss(parentCss)} onClick={onClick}>
      <div>{location?.latitude}</div>
      <div>{location?.longitude}</div>

      <ShelterCardHero
        className="md:w-96 md:mr-4"
        imageUrl={heroImage}
        shelterName={name}
      />

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
