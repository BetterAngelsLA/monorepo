import {
  Card,
  isEmail,
  isValidURL,
  toValidWebURL,
} from '@monorepo/react/components';
import {
  CallIcon,
  EmailIcon,
  GlobeIcon,
  InstagramIcon,
  LocationIcon,
} from '@monorepo/react/icons';
import parsePhoneNumber from 'libphonenumber-js';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

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
        {key === 'instagram' ? 'Instagram' : 'Website'}
      </a>
    );
  }

  return label;
}

export function GeneralInfo({
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
      label: shelter?.instagram,
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
    <Card px="px-0" pb="pb-0" className="!pt-0">
      {contactInfo
        .filter((info) => !!info.label)
        .map((info) => (
          <div
            key={info.key}
            className="border-b border-neutral-90 last:border-b-0 flex items-center justify-between px-6 py-4 gap-1"
          >
            {renderLabel(info.label, info.key)}
            {info.icon}
          </div>
        ))}
    </Card>
  );
}
