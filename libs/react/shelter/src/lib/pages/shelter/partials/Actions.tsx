import { openInMaps } from '@monorepo/react/components';
import {
  CallOutlinedIcon,
  LocationIcon,
  ShareIcon,
} from '@monorepo/react/icons';
import { toPhoneParts, type PhoneNumberString } from '@monorepo/shared/scalars';

type TShelterLocation = {
  place: string;
  latitude: number;
  longitude: number;
};

type TProps = {
  location?: TShelterLocation | null;
  phone?: PhoneNumberString | null;
  shelterName: string;
};

export function Actions({ location, phone, shelterName }: TProps) {
  const { display: phoneLabel, dial } = toPhoneParts(phone);

  const handleShare = async () => {
    const shareData = {
      title: shelterName,
      text: `${shelterName} `,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      } catch {
        alert(
          'Could not share — please copy the link manually from the URL bar.',
        );
      }
    }
  };

  return (
    <div className="flex p-1 items-center justify-between text-xs border-neutral-90 border-t border-b mt-4 -mx-4">
      <a
        className="flex-1 group"
        aria-label={dial ? `Call ${phoneLabel}` : undefined}
        href={dial ? `tel:${dial}` : undefined}
      >
        <div
          className={`flex py-3 ${
            !dial && 'bg-neutral-99'
          } flex-col rounded-sm items-center active:bg-neutral-98 ${
            !dial && 'text-neutral-90'
          }`}
        >
          <CallOutlinedIcon className="w-6 h-6 fill-primary-20" />
          <span className="group-active:font-bold">Call</span>
        </div>
      </a>

      <button
        disabled={!location}
        onClick={() =>
          openInMaps(location?.latitude, location?.longitude, location?.place)
        }
        className={`flex flex-1 flex-col ${
          !location && 'text-neutral-99'
        } active:bg-neutral-98 items-center py-3 group rounded-sm ${
          !location && 'text-neutral-90'
        }`}
      >
        <LocationIcon className="w-6 h-6 fill-primary-20" />
        <span className="group-active:font-bold">Directions</span>
      </button>

      <button
        onClick={handleShare}
        className={`flex flex-1 active:bg-neutral-90 flex-col items-center py-3 group rounded-sm`}
      >
        <ShareIcon className="w-6 h-6 fill-primary-20" />
        <span className="group-active:font-bold">Share</span>
      </button>
    </div>
  );
}
