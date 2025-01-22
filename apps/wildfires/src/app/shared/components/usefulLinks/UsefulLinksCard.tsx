import { GlobeIcon, WFLinkIcon } from '@monorepo/react/icons';
import { ReactNode } from 'react';

interface IUsefulLinksCardProps {
  children: ReactNode;
  urlTitle: string;
  url: string;
}

export default function UsefulLinksCard(props: IUsefulLinksCardProps) {
  const { children, urlTitle, url } = props;
  return (
    <div className="bg-white flex-1 p-6 flex flex-col items-center justify-between aspect-video">
      <div className="flex items-center justify-center flex-1">{children}</div>
      <a href={url} className="flex items-center justify-center mt-8 gap-2">
        <GlobeIcon stroke="#1E3342" className="h-4 w-4" />
        <p className="text-sm">{urlTitle}</p>
        <WFLinkIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
