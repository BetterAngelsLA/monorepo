import {
  Card,
  ExpandableContainer,
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
import { WysiwygContainer } from '../../../../components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';
import { hasWysiwygContent } from '../../utils';
import { GeneralServices } from './GeneralServices';

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

  const hasNotesContent = hasWysiwygContent(shelter.otherServices);

  return (
    <Card px="px-0" pb="pb-0">
      <div className="gap-2 flex flex-col px-6">
        {shelter.totalBeds && (
          <>
            <h3 className="text-base font-semibold">Capacity</h3>
            <div>
              <p>{shelter.totalBeds} beds</p>
            </div>
          </>
        )}

        <GeneralServices shelter={shelter} />
      </div>
      {contactInfo.map(
        (info) =>
          (info.key !== 'instagram' || info.label) && (
            <div
              key={info.key}
              className="border-t border-neutral-90 flex items-center justify-between px-6 py-4 gap-1"
            >
              {renderLabel(info.label, info.key)}
              {info.icon}
            </div>
          )
      )}

      {hasNotesContent && (
        <div className="border-t border-neutral-90 flex items-center justify-between px-6 py-4">
          <ExpandableContainer
            header="Additional Notes"
            className="w-full"
            iconClassName="w-[8px]"
            headerClassName="min-h-6"
          >
            <WysiwygContainer content={shelter.otherServices} className="" />
          </ExpandableContainer>
        </div>
      )}
    </Card>
  );
}
