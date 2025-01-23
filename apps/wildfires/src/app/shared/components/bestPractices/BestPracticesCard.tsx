import { ChevronLeftIcon } from '@monorepo/react/icons';
import { FC, ReactNode, useState } from 'react';

interface IBestPracticesCardProps {
  Icon: FC<{ className?: string }>;
  title: string;
  description: ReactNode;
  bgColor: string;
}

export default function BestPracticesCard(props: IBestPracticesCardProps) {
  const { Icon, title, description, bgColor } = props;
  const [expand, setExpand] = useState(false);
  return (
    <div
      className={`${bgColor} rounded-[20px] w-full p-6 md:p-10 flex items-center gap-4 mb-4 md:mb-10 relative`}
    >
      <ChevronLeftIcon
        onClick={() => setExpand(!expand)}
        className={`h-6 w-6 absolute md:hidden top-6 right-5 ${
          expand ? 'rotate-90' : '-rotate-90'
        }`}
      />
      <div className="min-w-[50px] h-[50px] md:min-w-[100px] md:h-[100px] rounded-full bg-white flex items-center justify-center">
        <Icon className="h-6 w-6 md:h-10 md:w-10 text-brand-dark-blue" />
      </div>
      <div>
        <h3 className="text-xl md:text-[32px] md:leading-[41.6px] font-bold mb-4 pr-6 md:pr-0">
          {title}
        </h3>
        <p className={`md:hidden md:text-2xl ${expand ? 'block' : 'hidden'}`}>
          {description}
        </p>
        <p className="hidden md:text-2xl md:block">{description}</p>
      </div>
    </div>
  );
}
