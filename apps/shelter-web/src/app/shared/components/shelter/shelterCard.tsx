import { useMap } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  footer?: ReactNode | null;
  footerClassName?: string;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: { id, name, heroImage, distanceInMiles, location },
    originCoordinates,
    className,
    footer,
    footerClassName,
  } = props;
  const map = useMap();

  const navigate = useNavigate();

  const formattedAddress = location?.place.replace(/, USA$/, '');

  const parentCss = ['flex', 'flex-col', 'cursor-pointer', className];

  const bodyCss = ['flex', 'flex-col', 'md:flex-row', 'cursor-pointer'];

  const footerCss = ['mt-4', 'md:mt-10', footerClassName];

  const contentCss = ['mt-4'];

  const onNavigate = () => {
    sessionStorage.setItem(
      'mapCenter',
      JSON.stringify({
        lat: location?.latitude,
        lng: location?.longitude,
        zoom: map?.getZoom(),
      })
    );
    navigate(`/shelter/${id}`);
  };

  return (
    <div className={mergeCss(parentCss)} onClick={onNavigate}>
      <div className={mergeCss(bodyCss)}>
        <ShelterCardHero
          className="md:w-96 md:mr-4"
          imageUrl={heroImage}
          shelterName={name}
        />

        <div className={mergeCss(contentCss)}>
          <div className="font-semibold md:text-lg leading-[1.125rem] tracking-[.03125rem]">
            {name}
          </div>

          {formattedAddress && (
            <div className="text-sm md:text-sm mt-2 flex items-start">
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
      {footer && <div className={mergeCss(footerCss)}>{footer}</div>}
    </div>
  );
}
