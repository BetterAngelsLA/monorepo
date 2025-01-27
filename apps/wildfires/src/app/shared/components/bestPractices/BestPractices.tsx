import { CameraIcon, WFAnnouncement } from '@monorepo/react/icons';

import BestPracticesCard from './BestPracticesCard';

export default function BestPractices() {
  return (
    <div className="w-full my-8 md:my-24 break-inside-avoid">
      <BestPracticesCard
        bgColor="bg-brand-yellow-light"
        title="Document everything!"
        description="Take videos and pictures of damages, keep receipts of all expenses!"
        Icon={CameraIcon}
      />
      <BestPracticesCard
        bgColor="bg-brand-angel-blue"
        title="Access the valuable resources available to you. Below are steps you
            can take now."
        description={
          <>
            These are listed in order of priority and can be your guide to
            navigating online and/or to help you be prepared for an in-person
            meeting at a{' '}
            <a
              className="underline"
              target="_blank"
              href="https://www.disasterassistance.gov/"
              rel="noreferrer"
            >
              Disaster Recovery Center.
            </a>
          </>
        }
        Icon={WFAnnouncement}
      />
    </div>
  );
}
