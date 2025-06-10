import { CallIcon, LocationIcon, ShareIcon } from '@monorepo/react/icons';

interface ActionsProps {
  phone?: string | null;
}

export default function Actions({ phone }: ActionsProps) {
  return (
    <div className="flex items-center py-4 justify-between text-xs px-11 border-neutral-90 border-t border-b mt-4 -mx-4">
      <a href={phone ? `tel:${phone}` : undefined}>
        <div className="flex flex-col items-center">
          <CallIcon className="w-6 h-6 fill-primary-20" />
          <span>Call</span>
        </div>
      </a>
      <div className="flex flex-col items-center">
        <LocationIcon className="w-6 h-6 fill-primary-20" />
        <span>Directions</span>
      </div>
      <div className="flex flex-col items-center">
        <ShareIcon className="w-6 h-6 fill-primary-20" />
        <span>Share</span>
      </div>
    </div>
  );
}
