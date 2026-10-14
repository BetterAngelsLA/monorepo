import { Card } from '@monorepo/react/components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';
import { ContactInfoList } from './components/ContactInfoList';

export function GeneralInfo({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card px="px-0" pb="pb-0" className="!pt-0">
      <ContactInfoList shelter={shelter} />
    </Card>
  );
}
