import { CameraIcon, InfoIcon } from '@monorepo/react/icons';
import ImportantTipCard from './ImportantTipCard';

const DATA = {
  tax: [
    {
      title: 'Crowdfunding and Tax Considerations',
      description:
        'GoFundMe and other crowd sourcing funds will be considered as taxable income unless they are specifically designated as gifts.',
      Icon: InfoIcon,
    },
    {
      title: 'Eligibility Restrictions for FEMA Assistance',
      description:
        'If you have rental or homeowners insurance, do not apply for FEMA, unless you are self-employed or a gig worker.',
      Icon: InfoIcon,
    },
  ],
  photo: [
    {
      title: 'Take pictures and keep receipts for everything you do!',
      Icon: CameraIcon,
    },
  ],
};

export default function ImportantTips() {
  return (
    <div className="bg-brand-yellow-light rounded-[20px] p-4 md:p-8 md:pb-[3.75rem] w-full my-12 md:my-20">
      <h3 className="uppercase font-bold md:text-2xl mb-8 md:mb-10">
        Important Tips
      </h3>
      <ImportantTipCard title="Tax & Insurance" data={DATA.tax} />
      <ImportantTipCard title="Document Everything!" data={DATA.photo} />
    </div>
  );
}
