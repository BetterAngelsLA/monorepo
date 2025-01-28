import { PropsWithChildren } from 'react';
import { mergeCss } from '../../../shared/utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  backgroundImage?: string;
}

export function HeroContent(props: IProps) {
  const { className } = props;

  const parentCss = [
    'w-full',
    'h-full',
    'bg-[rgba(30,51,66,0.3)]',
    'md:bg-[rgba(30,51,66,0.6)]',
    'md:h-auto',
    'px-10',
    'pt-12',
    'pb-[4.5rem]',
    'md:py-16',
    'text-white',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
        <h1 className="whitespace-nowrap flex-1 mb-10 md:mb-0 border-l-[10px] border-brand-yellow pl-4 text-left text-5xl md:text-[64px] md:leading-[1.2] font-extralight">
          Get the help <br /> you need
        </h1>
        <p className="flex-1 text-xl md:text-2xl leading-[30px] md:leading-[48px] text-justify md:text-start">
          The wildfires have impacted us in so many different ways. The LA
          Disaster Relief Navigator is here to help you quickly create a
          personalized action plan that contains the critical financial and
          wellness resources available to you.
        </p>
      </div>
    </div>
  );
}
