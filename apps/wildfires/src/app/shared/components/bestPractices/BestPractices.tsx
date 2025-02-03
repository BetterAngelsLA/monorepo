import { WFCheckbox } from '@monorepo/react/icons';

import BestPracticesCard from './BestPracticesCard';

export default function BestPractices() {
  return (
    <div className="w-full my-8 md:my-24 break-inside-avoid">
      <BestPracticesCard
        bgColor="bg-brand-angel-blue"
        title="Your Personalized Plan"
        description="This action plan is meant to provide you with valuable resources and tips to guide you through the wildfire recovery process.  We've organized the information to make it easier for you to get the help you need."
        Icon={WFCheckbox}
      />
    </div>
  );
}
