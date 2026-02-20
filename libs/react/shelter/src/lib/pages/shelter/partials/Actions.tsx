import { openInMaps } from '@monorepo/react/components';
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

export function Actions({ location, phone, shelterName }: TProps) {
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
          'Could not share — please copy the link manually from the URL bar.'
        );
      }
    }
  };

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
          openInMaps(location?.latitude, location?.longitude, location?.place)
        }
        className={`flex flex-col items-center ${!location && 'opacity-50'}`}
      >
        <LocationIcon className="w-6 h-6 fill-primary-20" />
        <span>Directions</span>
      </button>

      <button onClick={handleShare} className="flex flex-col items-center">
        <ShareIcon className="w-6 h-6 fill-primary-20" />
        <span>Share</span>
      </button>
    </div>
  );
}
