import { LockIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TLatLng } from '../Map';
import { DistanceAway } from './DistanceAway';
import { ShelterCardHero } from './ShelterCardHero';

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
  isPrivate?: boolean | null;
  location?: TShelterLocation | null;
  shelterTypes?: Array<{
    name?: string | null;
  }>;
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
    shelter: { id, name, heroImage, distanceInMiles, isPrivate, location },
    originCoordinates,
    className,
    footer,
    footerClassName,
  } = props;
  const map = useMap();

  const navigate = useNavigate();

  const formattedAddress = location?.place.replace(/, USA$/, '');

  const parentCss = ['flex', 'flex-col', 'cursor-pointer', className];

  const bodyCss = ['flex', 'flex-col', 'md:flex-row', 'overflow-hidden'];

  const contentCss = ['mt-4', 'flex-1', 'overflow-hidden'];

  const footerCss = ['mt-4', 'md:mt-10', footerClassName];

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
        <div className="relative w-full md:w-96 md:mr-4 md:shrink-0">
          <ShelterCardHero
            className="w-full"
            imageUrl={heroImage}
            shelterName={name}
          />
          {isPrivate && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded-[20px] px-2.5 py-1"
              title="Only visible to verified case managers"
            >
              <LockIcon className="w-3.5 h-3.5 text-primary-60" />
              <span className="text-xs text-primary-20 font-medium">
                Private
              </span>
            </div>
          )}
        </div>

        <div className={mergeCss(contentCss)}>
          <div className="font-semibold md:text-lg leading-4.5 tracking-[.03125rem] wrap-anywhere hyphens-auto">
            {name}
          </div>

          {formattedAddress && (
            <div className="text-sm md:text-sm mt-2 flex items-start">
              <div className="flex-inline flex-wrap">
                <span className="no-underline">{formattedAddress}</span>

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
