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

function openInMaps(lat?: number, lng?: number, label = '') {
  if (!lat || !lng) {
    return;
  }

  const q = encodeURIComponent(`${lat},${lng}${label ? ` (${label})` : ''}`);
  let url;

  if (isIOS) {
    url = `maps://?q=${q}`;
  } else if (isAndroid) {
    url = `geo:${lat},${lng}?q=${q}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
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
          openInMaps(location?.latitude, location?.longitude, shelterName)
        }
        // onClick={() => {
        //   window.open(
        //     `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        //       `${location?.latitude},${location?.longitude}`
        //     )}`
        //   );
        // }}
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
