import { toValidWebURL } from '@monorepo/react/components';
import {
  CallIcon,
  EmailIcon,
  GlobeIcon,
  InstagramIcon,
  LocationIcon,
} from '@monorepo/react/icons';
import { toPhoneParts } from '@monorepo/shared/scalars';
import { ViewShelterQuery } from '../../../__generated__/shelter.generated';
import { ContactInfoRow } from './ContactInfoRow';
import { TContactInfoRow } from './types';

export function ContactInfoList({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const phone = toPhoneParts(shelter?.phone);

  const contactInfo: TContactInfoRow[] = [
    {
      type: 'website',
      label: 'Website',
      href: toValidWebURL(shelter?.website ?? ''),
      icon: <GlobeIcon className="h-6 w-6 stroke-primary-20" />,
    },
    {
      type: 'instagram',
      label: 'Instagram',
      href: shelter?.instagram,
      icon: <InstagramIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      type: 'phone',
      label: phone.display,
      href: phone.dial,
      icon: <CallIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      type: 'email',
      label: shelter?.email,
      href: shelter?.email,
      icon: <EmailIcon className="h-6 w-6 fill-primary-20" />,
    },
    {
      type: 'location',
      label: shelter?.location?.place || 'Address',
      location: shelter?.location,
      icon: <LocationIcon className="h-6 w-6 fill-primary-20" />,
    },
  ];

  return (
    <>
      {contactInfo.map((info) => (
        <ContactInfoRow key={info.type} {...info} />
      ))}
    </>
  );
}
