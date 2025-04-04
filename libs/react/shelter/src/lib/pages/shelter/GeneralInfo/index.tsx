import { Card } from '@monorepo/react/components';
import {
  CallIcon,
  EmailIcon,
  GlobeIcon,
  InstagramIcon,
  LocationIcon,
} from '@monorepo/react/icons';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import GeneralServices from './GeneralServices';

export default function GeneralInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const contactInfo = [
    {
      label: shelter?.website,
      key: 'website',
      icon: <GlobeIcon className="h-6 w-6 stroke-primary-20" />,
    },
    {
      label: 'instagram',
      key: 'instagram',
      icon: <InstagramIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      label: shelter?.phone,
      key: 'phone',
      icon: <CallIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      label: shelter?.email,
      key: 'email',
      icon: <EmailIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      label: shelter?.location?.place,
      key: 'location',
      icon: <LocationIcon className="h-6 w-6 fill-primary-20" />,
    },
  ];
  return (
    <Card px="px-0" pb="pb-0">
      <div className="gap-2 flex flex-col px-6">
        {shelter.totalBeds && (
          <div>
            <p>{shelter.totalBeds} beds available</p>
          </div>
        )}

        <GeneralServices shelter={shelter} />
      </div>
      {contactInfo.map((info) => (
        <div
          key={info.key}
          className="border-t border-neutral-90 flex items-center justify-between px-6 py-4 gap-1"
        >
          {info.label || 'Not Available'}
          {info.icon}
        </div>
      ))}
    </Card>
  );
}
