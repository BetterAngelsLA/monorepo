import { ReactNode } from 'react';

interface IPartnerCardProps {
  link: string;
  children: ReactNode;
}

export default function PartnerCard(props: IPartnerCardProps) {
  const { link, children } = props;
  return (
    <a
      href={link}
      target="_blank"
      className="flex items-center justify-center bg-white px-4 py-6 rounded-[20px] aspect-video w-[300px] md:w-[260px]"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
