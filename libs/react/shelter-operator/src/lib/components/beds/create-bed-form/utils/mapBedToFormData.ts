import type {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
} from '../../../../apollo/graphql/__generated__/types';
import type { GetBedQuery } from '../../../beds/__generated__/getBed.generated';
import { createEmptyBedFormData } from '../constants/defaultBedFormData';
import type { BedFormData } from '../formTypes';

type BedQueryResult = NonNullable<GetBedQuery['beds']['results'][number]>;

export function mapBedToFormData(bed: BedQueryResult): BedFormData {
  const defaults = createEmptyBedFormData();

  return {
    ...defaults,
    name: bed.name ?? '',
    roomId: bed.room?.id ?? null,
    status: bed.status ?? defaults.status,
    statusNotes: bed.statusNotes ?? '',
    type: bed.type ?? null,
    demographics:
      bed.demographics
        ?.map((d) => d.name)
        .filter((name): name is DemographicChoices => name != null) ?? [],
    accessibility:
      bed.accessibility
        ?.map((a) => a.name)
        .filter((name): name is AccessibilityChoices => name != null) ?? [],
    funders:
      bed.funders
        ?.map((f) => f.name)
        .filter((name): name is FunderChoices => name != null) ?? [],
    pets:
      bed.pets
        ?.map((p) => p.name)
        .filter((name): name is PetChoices => name != null) ?? [],
    storage: bed.storage ?? defaults.storage,
    maintenanceFlag: bed.maintenanceFlag ?? defaults.maintenanceFlag,
    b7: bed.b7 ?? defaults.b7,
    fees: bed.fees ?? null,
    medicalNeeds: bed.medicalNeeds ?? null,
  };
}
