import { CallIcon, LocationIcon, ShareIcon } from '@monorepo/react/icons';

type TShelterLocation = {
  place: string;
  latitude: number;
  longitude: number;
};

type TProps = {
  shelterName: string;
  location?: TShelterLocation | null;
};

export default function Actions({ location, shelterName }: TProps) {
  return (
    <div className="flex items-center py-4 justify-between text-xs px-11 border-neutral-90 border-t border-b mt-4 -mx-4">
      <div className="flex flex-col items-center">
        <CallIcon className="w-6 h-6 fill-primary-20" />
        <span>Call</span>
      </div>

      <button
        onClick={() => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${shelterName}+@${location?.latitude},${location?.longitude}`
            )}`,
            '_blank'
          );
        }}
        className="flex flex-col items-center"
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
