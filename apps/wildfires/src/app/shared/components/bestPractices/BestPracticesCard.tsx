import { ChevronLeftIcon } from '@monorepo/react/icons';
import { FC, ReactNode } from 'react';
import { usePrintExpansion } from '../../hooks/usePrintExpansion';

interface IBestPracticesCardProps {
  Icon: FC<{ className?: string }>;
  title: string;
  description: ReactNode;
  bgColor: string;
}

export default function BestPracticesCard(props: IBestPracticesCardProps) {
  const { Icon, title, description, bgColor } = props;
  const { isOpen, handleToggle } = usePrintExpansion();

  return (
    <div
      className={`${bgColor} rounded-[20px] w-full p-6 md:p-10 flex items-center gap-4 mb-4 md:mb-10 relative`}
    >
      <ChevronLeftIcon
        onClick={handleToggle}
        className={`h-6 w-6 absolute md:hidden top-6 right-5 ${
          isOpen ? 'rotate-90' : '-rotate-90'
        }`}
      />
      <div className="min-w-[50px] h-[50px] md:min-w-[100px] md:h-[100px] rounded-full bg-white flex items-center justify-center">
        <Icon className="h-[40px] w-[40px] lg:h-[60px] lg:w-[60px] text-brand-dark-blue" />
      </div>
      <div>
        <h3 className="text-xl md:text-[32px] md:leading-[1.2] font-bold mb-4 pr-6 md:pr-0">
          {title}
        </h3>
        <p className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
          {description}
        </p>
        <p className="hidden md:block">{description}</p>
      </div>
    </div>
  );
}
