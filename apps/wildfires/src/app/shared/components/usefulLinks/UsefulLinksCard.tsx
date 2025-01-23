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
    <div className="md:bg-white w-full p-5 md:w-[370px] md:h-[216px] flex flex-col items-center justify-between aspect-video">
      <div className="flex items-center justify-center flex-1">{children}</div>
      <a
        href={url}
        className="flex items-center justify-center gap-2 bg-white md:bg-transparent py-5 md:py-0 w-full rounded-[50px]"
      >
        <GlobeIcon stroke="#1E3342" className="h-4 w-4" />
        <p className="text-sm">{urlTitle}</p>
        <WFLinkIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
