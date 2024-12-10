import LocationIcon from '@assets/icons/locationIcon.svg?react';

import { calcDistance } from '../../utils/distance/calcDistance';
import { formatDistance } from '../../utils/distance/formatDistance';
import { TLatLng } from '../maps/types.maps';

export type TShelter = {
  id: string;
  name: string;
  address: string;
  heroImage?: string | null;
  distance?: number | null;
  location: {
    latitude: number;
    longitude: number;
    place: string;
  };
};

type TShelterCard = {
  className?: string;
  shelter: TShelter;
  originCoordinates?: TLatLng | null;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: {
      name,
      heroImage,
      location: { place, latitude: shelterLat, longitude: shelterLng },
    },
    originCoordinates,
    className = '',
  } = props;

  let formattedDistance;

  if (originCoordinates && shelterLat && shelterLng) {
    const shelterCoords = {
      lat: shelterLat,
      lng: shelterLng,
    };

    formattedDistance = getFormattedDistance(originCoordinates, shelterCoords);
  }

  const formattedAddress = place.replace(/, USA$/, '');

  const cardCss = [className].join(' ');

  return (
    <div className={cardCss}>
      {heroImage && (
        <div className="mb-4">
          <img
            src={heroImage}
            alt={`hero image for ${name}`}
            loading="lazy"
            className="aspect-[4/3] rounded-[20px]"
          />
        </div>
      )}

      <div className="font-semibold text-sm leading-[1.125rem] tracking-[.03125rem]">
        {name}
      </div>

      {formattedAddress && (
        <div className="text-xs mt-1.5 flex items-start">
          <LocationIcon className="mr-2" />

          <div className="flex-inline flex-wrap">
            <span>{formattedAddress}</span>

            {!!formattedDistance && (
              <span className="ml-1">({formattedDistance} away)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getFormattedDistance(pointA?: TLatLng, pointB?: TLatLng) {
  if (!pointA || !pointB) {
    return '';
  }

  const distanceMiles = calcDistance({
    pointA,
    pointB,
  });

  return formatDistance({
    distance: distanceMiles,
    minimum: 0.1,
  });
}
