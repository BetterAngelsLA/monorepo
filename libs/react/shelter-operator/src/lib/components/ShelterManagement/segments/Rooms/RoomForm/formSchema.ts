import {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
  RoomStatusChoices,
  RoomStyleChoices,
} from '@monorepo/ba-platform/types';
import { z } from 'zod';
import { UseRoomResultType } from '../../../../../hooks';
import { toDropdownOptions } from '../../../../base-ui/dropdown';

export type RoomFormData = z.infer<typeof formSchema>;

export const formSchema = z.object({
  accessibility: z.array(z.enum(AccessibilityChoices)),
  amenities: z.string(),
  demographics: z.array(z.enum(DemographicChoices)),
  funders: z.array(z.enum(FunderChoices)),
  maintenanceFlag: z.boolean(),
  medicalRespite: z.boolean(),
  name: z.string().trim().min(1, 'Room name is required'),
  notes: z.string(),
  pets: z.array(z.enum(PetChoices)),
  storage: z.boolean(),
  type: z.enum(RoomStyleChoices).nullable(),
  typeOther: z.string(),
});

const ROOM_STATUS_LABELS: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'Available',
  [RoomStatusChoices.OutOfService]: 'Out of Service',
  [RoomStatusChoices.InTurnaround]: 'In Turnaround',
  [RoomStatusChoices.Occupied]: 'Occupied',
  [RoomStatusChoices.Reserved]: 'Reserved',
};

export const ROOM_STATUS_OPTIONS = toDropdownOptions(ROOM_STATUS_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

export const createEmptyRoomFormData = (): RoomFormData => ({
  name: '',
  type: null,
  typeOther: '',
  notes: '',
  amenities: '',
  medicalRespite: false,
  demographics: [],
  accessibility: [],
  funders: [],
  pets: [],
  storage: false,
  maintenanceFlag: false,
});

function toChoiceNames<T extends string>(
  items: ReadonlyArray<{ name?: T | null }> | undefined,
): T[] {
  return (
    items?.map((item) => item.name).filter((name): name is T => name != null) ??
    []
  );
}

export function toFormData(room: UseRoomResultType): RoomFormData {
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
    storage: room.storage ?? defaults.storage,
    type: room.type ?? null,
    typeOther: room.typeOther ?? '',
  };
}
