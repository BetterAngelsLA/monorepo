import {
  Card,
  isEmail,
  isValidURL,
  toValidWebURL,
} from '@monorepo/react/components';
import {
  BedIcon,
  CallIcon,
  EmailIcon,
  GlobeIcon,
  InstagramIcon,
  LocationIcon,
} from '@monorepo/react/icons';
import parsePhoneNumber from 'libphonenumber-js';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import GeneralServices from './GeneralServices';

function renderLabel(
  label?: string | null,
  key?: string | null
): React.ReactNode {
  if (!label) return 'Not Available';

  if (isEmail(label)) {
    return (
      <a href={`mailto:${label}`} className="underline">
        {label}
      </a>
    );
  }

  if (key === 'phone') {
    return (
      <a className="underline" href={`tel:${label}`}>
        {label}
      </a>
    );
  }

  if (isValidURL(label)) {
    const href = toValidWebURL(label);
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Website
      </a>
    );
  }

  return label;
}

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
      label: 'Instagram',
      key: 'instagram',
      icon: <InstagramIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      label: parsePhoneNumber(shelter?.phone ?? '', 'US')?.formatNational(),
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
          <div className="flex items-center justify-between gap-1">
            <p>{shelter.totalBeds} beds available</p>
            <BedIcon className="h-6 w-6 fill-primary-20" />
          </div>
        )}

        <GeneralServices shelter={shelter} />
      </div>
      {contactInfo.map((info) => (
        <div
          key={info.key}
          className="border-t border-neutral-90 flex items-center justify-between px-6 py-4 gap-1"
        >
          {renderLabel(info.label, info.key)}
          {info.icon}
        </div>
      ))}
    </Card>
  );
}
