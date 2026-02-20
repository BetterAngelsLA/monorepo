import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TLatLng } from '@monorepo/react/components';
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
  exteriorPhotos?: Array<{ file: { url: string; name: string } }> | null;
  interiorPhotos?: Array<{ file: { url: string; name: string } }> | null;
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
    shelter: {
      id,
      name,
      heroImage,
      distanceInMiles,
      location,
      exteriorPhotos,
      interiorPhotos,
    },
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

  const photos = [...(exteriorPhotos || []), ...(interiorPhotos || [])];

  return (
    <div className={mergeCss(parentCss)} onClick={onNavigate}>
      <div className={mergeCss(bodyCss)}>
        <div className="w-full md:w-96 md:mr-4 min-w-0">
          <ShelterCardHero
            className="w-full"
            imageUrl={heroImage}
            photos={photos}
            shelterName={name}
          />
        </div>

        <div className={mergeCss(contentCss)}>
          <div className="font-semibold md:text-lg leading-[1.125rem] tracking-[.03125rem]">
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
