import { Card } from '@monorepo/react/components';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import GeneralServices from './GeneralServices';

export default function GeneralInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const contactInfo = [
    { label: shelter?.website, key: 'website' },
    { label: 'instagram', key: 'instagram' },
    { label: shelter?.phone, key: 'phone' },
    { label: shelter?.email, key: 'email' },
    { label: shelter?.location?.place, key: 'location' },
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
      {contactInfo
        .filter((info) => info.label)
        .map((info) => (
          <div
            key={info.key}
            className="border-t border-neutral-90 flex items-center justify-between px-6 py-4"
          >
            {info.label}
          </div>
        ))}
    </Card>
  );
}
