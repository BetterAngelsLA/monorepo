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
import { toPhoneParts } from '@monorepo/shared/scalars';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

function renderLabel(
  label?: string | null,
  key?: string | null,
  href?: string,
): React.ReactNode {
  if (!label) return 'Not Available';

  if (isEmail(label)) {
    return (
      <a
        href={`mailto:${label}`}
        className="
  underline
  rounded-lg
  px-2 py-1
  transition-all
  active:bg-[#E8ECF2]
  active:opacity-70
"
      >
        {label}
      </a>
    );
  }

  if (key === 'phone' && href) {
    return (
      <a
        href={`tel:${href}`}
        className="
  underline
  rounded-lg
  px-2 py-1
  transition-all
  active:bg-[#E8ECF2]
  active:opacity-70
"
      >
        {label}
      </a>
    );
  }

  if (isValidURL(label)) {
    const webHref = toValidWebURL(label);
    return (
      <a
        href={webHref}
        target="_blank"
        rel="noopener noreferrer"
        className="
  underline
  rounded-lg
  px-2 py-1
  transition-all
  active:bg-[#E8ECF2]
  active:opacity-70
"
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
  const phone = toPhoneParts(shelter?.phone);

  const contactInfo: {
    label?: string | null;
    href?: string;
    key: string;
    icon: React.ReactNode;
  }[] = [
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
      label: phone.display,
      href: phone.dial,
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
            {renderLabel(info.label, info.key, info.href)}
            {info.icon}
          </div>
        ))}
    </Card>
  );
}
