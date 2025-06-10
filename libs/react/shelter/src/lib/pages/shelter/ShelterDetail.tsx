import { Card } from '@monorepo/react/components';
import {
  AccessibilityChoices,
  ParkingChoices,
  PetChoices,
  StorageChoices,
} from '../../apollo';
import {
  enumDisplayAccessibilityChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayStorageChoices,
} from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';
import { InlineList } from './shared/InlineList';

export default function ShelterDetail({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Shelter Details">
      <div className="flex flex-col gap-2">
        <InlineList
          title="Accessibility:"
          items={shelter?.accessibility.map(
            (i) =>
              enumDisplayAccessibilityChoices[i.name as AccessibilityChoices]
          )}
        />

        <InlineList
          title="Storage:"
          items={shelter?.storage.map(
            (i) => enumDisplayStorageChoices[i.name as StorageChoices]
          )}
        />

        <InlineList
          title="Pets:"
          items={shelter?.pets.map(
            (i) => enumDisplayPetChoices[i.name as PetChoices]
          )}
        />

        <InlineList
          title="Parking:"
          items={shelter?.parking.map(
            (i) => enumDisplayParkingChoices[i.name as ParkingChoices]
          )}
        />
      </div>
    </Card>
  );
}
