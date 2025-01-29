import { CameraIcon, WFAnnouncement } from '@monorepo/react/icons';

import { mergeCss } from '../../utils/styles/mergeCss';
import BestPracticesCard from './BestPracticesCard';

type IProps = {
  className?: string;
  expanded?: boolean;
};

export default function BestPractices(props: IProps) {
  const { className, expanded } = props;

  const parentCss = ['w-full my-8 md:my-24 break-inside-avoid', className];

  return (
    <div className={mergeCss(parentCss)}>
      <BestPracticesCard
        bgColor="bg-brand-yellow-light"
        title="Remember to document everything"
        description="Take videos and pictures of damages, keep receipts of all expenses!"
        Icon={CameraIcon}
        expanded={expanded}
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
              aria-label="open disaster recovery center website in new tab"
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
        expanded={expanded}
      />
    </div>
  );
}
