import type {
  AccessibilityChoices,
  BedType,
  DemographicChoices,
  FunderChoices,
  MedicalNeedChoices,
  PetChoices,
} from '../../../../apollo/graphql/__generated__/types';
import { createEmptyBedFormData } from '../constants/defaultBedFormData';
import type { BedFormData } from '../formTypes';

type BedQueryResult = Pick<
  BedType,
  | 'accessibility'
  | 'b7'
  | 'demographics'
  | 'fees'
  | 'funders'
  | 'maintenanceFlag'
  | 'medicalNeeds'
  | 'name'
  | 'pets'
  | 'status'
  | 'statusNotes'
  | 'storage'
  | 'type'
> & {
  room?: Pick<NonNullable<BedType['room']>, 'id'> | null;
};

function toChoiceNames<T extends string>(
  items: ReadonlyArray<{ name?: T | null }> | undefined
): T[] {
  return (
    items?.map((item) => item.name).filter((name): name is T => name != null) ??
    []
  );
}

export function mapBedToFormData(bed: BedQueryResult): BedFormData {
  const defaults = createEmptyBedFormData();

  return {
    ...defaults,
    accessibility: toChoiceNames<AccessibilityChoices>(bed.accessibility),
    b7: bed.b7 ?? defaults.b7,
    demographics: toChoiceNames<DemographicChoices>(bed.demographics),
    fees: bed.fees ?? null,
    funders: toChoiceNames<FunderChoices>(bed.funders),
    maintenanceFlag: bed.maintenanceFlag ?? defaults.maintenanceFlag,
    medicalNeeds: toChoiceNames<MedicalNeedChoices>(bed.medicalNeeds),
    name: bed.name ?? '',
    pets: toChoiceNames<PetChoices>(bed.pets),
    roomId: bed.room?.id ?? null,
    status: bed.status ?? defaults.status,
    statusNotes: bed.statusNotes ?? '',
    storage: bed.storage ?? defaults.storage,
    type: bed.type ?? null,
  };
}
