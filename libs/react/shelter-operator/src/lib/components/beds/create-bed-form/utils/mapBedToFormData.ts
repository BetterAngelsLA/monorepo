import type {
  AccessibilityChoices,
  BedType,
  DemographicChoices,
  FunderChoices,
  PetChoices,
} from '../../../../apollo/graphql/__generated__/types';
import { createEmptyBedFormData } from '../constants/defaultBedFormData';
import type { BedFormData } from '../formTypes';

type BedQueryResult = Pick<
  BedType,
  | 'name'
  | 'status'
  | 'statusNotes'
  | 'type'
  | 'demographics'
  | 'accessibility'
  | 'funders'
  | 'pets'
  | 'storage'
  | 'maintenanceFlag'
  | 'b7'
  | 'fees'
  | 'medicalNeeds'
> & {
  room?: Pick<NonNullable<BedType['room']>, 'id'> | null;
};

function toChoiceNames<T extends string>(
  items: ReadonlyArray<{ name?: T | null }> | undefined,
): T[] {
  return items?.map((item) => item.name).filter((name): name is T => name != null) ?? [];
}

export function mapBedToFormData(bed: BedQueryResult): BedFormData {
  const defaults = createEmptyBedFormData();

  return {
    ...defaults,
    name: bed.name ?? '',
    roomId: bed.room?.id ?? null,
    status: bed.status ?? defaults.status,
    statusNotes: bed.statusNotes ?? '',
    type: bed.type ?? null,
    demographics: toChoiceNames<DemographicChoices>(bed.demographics),
    accessibility: toChoiceNames<AccessibilityChoices>(bed.accessibility),
    funders: toChoiceNames<FunderChoices>(bed.funders),
    pets: toChoiceNames<PetChoices>(bed.pets),
    storage: bed.storage ?? defaults.storage,
    maintenanceFlag: bed.maintenanceFlag ?? defaults.maintenanceFlag,
    b7: bed.b7 ?? defaults.b7,
    fees: bed.fees ?? null,
    medicalNeeds: bed.medicalNeeds ?? null,
  };
}
