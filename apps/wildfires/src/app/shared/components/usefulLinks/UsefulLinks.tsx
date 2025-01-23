import { BenefitsCalIcon, DeoIcon, EddIcon } from '@monorepo/react/icons';
import Fema from '../../../../assets/images/FEMA-Logo.png';
import { mergeCss } from '../../utils/styles/mergeCss';
import UsefulLinksCard from './UsefulLinksCard';

type IParams = {
  className?: string;
};

export default function UsefulLinks(props: IParams) {
  const { className } = props;

  const parentCss = [
    'bg-brand-angel-blue',
    'py-12',
    'md:py-20',
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <h2 className="text-2xl md:text-[40px] md:leading-[94.5px] font-bold mb-6">
        Useful Links/Info
      </h2>
      <div className="flex flex-col md:flex-row items-stretch w-full justify-center gap-1 md:w-full px-10">
        <UsefulLinksCard
          urlTitle="disasterassistance.gov"
          url="https://www.disasterassistance.gov/"
        >
          <img className="w-[174px]" src={Fema} alt="FEMA" />
        </UsefulLinksCard>
        <UsefulLinksCard
          urlTitle="opportunity.lacounty.gov"
          url="https://opportunity.lacounty.gov/"
        >
          <DeoIcon className="h-[90px] md:h-[130px]" />
        </UsefulLinksCard>
        <UsefulLinksCard
          urlTitle="edd.ca.gov/unemployment"
          url="https://edd.ca.gov/unemployment"
        >
          <EddIcon className="w-[95px]" />
        </UsefulLinksCard>
        <UsefulLinksCard
          urlTitle="benefitscal.com"
          url="https://benefitscal.com/"
        >
          <BenefitsCalIcon className="h-[36px]" />
        </UsefulLinksCard>
      </div>
    </div>
  );
}
