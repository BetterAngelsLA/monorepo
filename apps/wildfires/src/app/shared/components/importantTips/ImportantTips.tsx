import { CameraIcon, InfoIcon } from '@monorepo/react/icons';

export default function ImportantTips() {
  return (
    <div className="bg-brand-yellow-light rounded-[20px] p-4 md:p-8 md:pb-[3.75rem] w-full my-12 md:my-20">
      <h3 className="uppercase font-bold md:text-2xl mb-8 md:mb-10">
        Important Tips
      </h3>
      <h2 className="font-bold text-2xl md:text-[40px] md:leading-[52px] pl-6 border-l-[10px] border-brand-orange mb-4 md:mb-[3.875rem]">
        Tax & Insurance
      </h2>
      <div className="bg-white rounded-[20px] w-full p-6 mb-4 md:mb-10">
        <div className="flex items-center gap-4 mb-6">
          <InfoIcon className="h-6 min-w-6 md:h-8 md:min-w-8" />
          <h3 className="font-bold text-xl md:text-2xl">
            Crowdfunding and Tax Considerations
          </h3>
        </div>
        <p className="md:text-xl">
          GoFundMe and other crowd sourcing funds will be considered as taxable
          income unless they are specifically designated as gifts.
        </p>
      </div>
      <div className="bg-white rounded-[20px] w-full p-6 mb-10 md:mb-20">
        <div className="flex items-center gap-4 mb-6">
          <InfoIcon className="h-6 min-w-6 md:h-8 md:min-w-8" />
          <h3 className="font-bold text-xl md:text-2xl">
            Eligibility Restrictions for FEMA Assistance
          </h3>
        </div>
        <p className="md:text-xl">
          If you have rental or homeowners insurance, do not apply for FEMA,
          unless you are self-employed or a gig worker.
        </p>
      </div>
      <h2 className="text-2xl font-bold md:text-[40px] md:leading-[52px] pl-6 border-l-[10px] border-brand-orange mb-4 md:mb-[3.875rem]">
        Document Everything!
      </h2>
      <div className="bg-white rounded-[20px] w-full p-6">
        <div className="flex items-center gap-4">
          <CameraIcon className="h-6 min-w-6 md:h-8 md:min-w-8" />
          <h3 className="font-bold text-xl  md:text-2xl">
            Take pictures and keep receipts for everything you do!
          </h3>
        </div>
      </div>
    </div>
  );
}
