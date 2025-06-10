import { CallIcon, LocationIcon, ShareIcon } from '@monorepo/react/icons';

type TProps = {
  shelterName: string;
};

export default function Actions({ shelterName }: TProps) {
  const handleShare = async () => {
    const shareData = {
      // title: shelterName,
      // text: `${shelterName} `,
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
      <div className="flex flex-col items-center">
        <CallIcon className="w-6 h-6 fill-primary-20" />
        <span>Call</span>
      </div>
      <div className="flex flex-col items-center">
        <LocationIcon className="w-6 h-6 fill-primary-20" />
        <span>Directions</span>
      </div>
      <button onClick={handleShare} className="flex flex-col items-center">
        <ShareIcon className="w-6 h-6 fill-primary-20" />
        <span>Share</span>
      </button>
    </div>
  );
}
