import { ReactNode } from 'react';

interface IPartnerCardProps {
  link: string;
  children: ReactNode;
  ariaLabel: string;
}

export default function PartnerCard(props: IPartnerCardProps) {
  const { ariaLabel, link, children } = props;
  return (
    <a
      aria-label={ariaLabel}
      href={link}
      target="_blank"
      className="flex md:w-[260px] h-[168px] items-center justify-center bg-white px-4 py-6 rounded-[20px] aspect-video w-[300px]"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
