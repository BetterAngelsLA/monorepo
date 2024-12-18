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

export default function ShelterDetail({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Shelter Details">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {shelter.accessibility
            .filter(
              (
                accessibility
              ): accessibility is { name: AccessibilityChoices } =>
                !!accessibility.name
            )
            .map(
              (accessibility) =>
                enumDisplayAccessibilityChoices[accessibility.name]
            )
            .join(', ')}
        </div>

        <div className="flex items-center gap-2">
          {shelter.storage
            .filter(
              (storage): storage is { name: StorageChoices } => !!storage.name
            )
            .map((storage) => enumDisplayStorageChoices[storage.name])
            .join(', ')}
        </div>
        <div className="flex items-center gap-2">
          {shelter.pets
            .filter((pet): pet is { name: PetChoices } => !!pet.name)
            .map((pet) => enumDisplayPetChoices[pet.name])
            .join(', ')}
        </div>
        <div className="flex items-center gap-2">
          {shelter.parking
            .filter(
              (parging): parging is { name: ParkingChoices } => !!parging.name
            )
            .map((parging) => enumDisplayParkingChoices[parging.name])
            .join(', ')}
        </div>
      </div>
    </Card>
  );
}
