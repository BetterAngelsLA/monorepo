import {
  CallRegularIcon,
  LocationIcon,
  ShareIcon,
} from '@monorepo/react/icons';

type TShelterLocation = {
  place: string;
  latitude: number;
  longitude: number;
};

type TProps = {
  location?: TShelterLocation | null;
  phone?: string | null;
  shelterName: string;
};

const ua = navigator.userAgent;

const isAndroid = /Android/i.test(ua);
const isIOS = /iPad|iPhone|iPod/i.test(ua);

function openDirections(lat?: number, lng?: number, label = '') {
  if (lat == null || lng == null) {
    return;
  }

  const coords = `${lat},${lng}`;
  const labelEscaped = label ? encodeURIComponent(label) : '';
  let url: string;

  if (isIOS) {
    const choice = window.prompt(
      'Open in:\n1. Apple Maps\n2. Google Maps',
      '1'
    );
    if (choice === '2') {
      url = `comgooglemaps://?daddr=${coords}&q=${labelEscaped}`;
    } else {
      url = `maps://?q=${coords}${labelEscaped ? ` (${labelEscaped})` : ''}`;
    }
  } else if (isAndroid) {
    url = `google.navigation:q=${coords}${
      labelEscaped ? `+(${labelEscaped})` : ''
    }`;
  } else {
    const destination = encodeURIComponent(
      coords + (label ? ` (${label})` : '')
    );
    url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  window.location.href = url;
}

export default function Actions({ location, phone, shelterName }: TProps) {
  return (
    <div className="flex items-center py-4 justify-between text-xs px-11 border-neutral-90 border-t border-b mt-4 -mx-4">
      <a href={phone ? `tel:${phone}` : undefined}>
        <div className={`flex flex-col items-center ${!phone && 'opacity-50'}`}>
          <CallRegularIcon className="w-6 h-6 fill-primary-20" />
          <span>Call</span>
        </div>
      </a>

      <button
        disabled={!location}
        onClick={() =>
          openDirections(location?.latitude, location?.longitude, shelterName)
        }
        className={`flex flex-col items-center ${!location && 'opacity-50'}`}
      >
        <LocationIcon className="w-6 h-6 fill-primary-20" />
        <span>Directions</span>
      </button>

      <div className="flex flex-col items-center">
        <ShareIcon className="w-6 h-6 fill-primary-20" />
        <span>Share</span>
      </div>
    </div>
  );
}
