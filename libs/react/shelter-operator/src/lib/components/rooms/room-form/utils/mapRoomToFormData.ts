import type {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
} from '../../../../apollo/graphql/__generated__/types';
import type { UseRoomResultType } from '../../../../hooks/useRoom';
import { createEmptyRoomFormData } from '../constants/defaultRoomFormData';
import type { RoomFormData } from '../formTypes';

function toChoiceNames<T extends string>(
  items: ReadonlyArray<{ name?: T | null }> | undefined
): T[] {
  return (
    items?.map((item) => item.name).filter((name): name is T => name != null) ??
    []
  );
}

export function mapRoomToFormData(room: UseRoomResultType): RoomFormData {
  const defaults = createEmptyRoomFormData();

  return {
    ...defaults,
    accessibility: toChoiceNames<AccessibilityChoices>(room.accessibility),
    amenities: room.amenities ?? '',
    demographics: toChoiceNames<DemographicChoices>(room.demographics),
    funders: toChoiceNames<FunderChoices>(room.funders),
    maintenanceFlag: room.maintenanceFlag ?? defaults.maintenanceFlag,
    medicalRespite: room.medicalRespite ?? defaults.medicalRespite,
    name: room.name ?? '',
    notes: room.notes ?? '',
    pets: toChoiceNames<PetChoices>(room.pets),
    status: room.status ?? defaults.status,
    storage: room.storage ?? defaults.storage,
    type: room.type ?? null,
    typeOther: room.typeOther ?? '',
  };
}
