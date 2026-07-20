import { z } from 'zod';
import {
  AccessibilityChoices,
  BedTypeChoices,
  DemographicChoices,
  FunderChoices,
  MedicalNeedChoices,
  PetChoices,
} from '../../../../../apollo/graphql/__generated__/types';
import type { UseBedResultType } from '../../../../../hooks';
import { toDropdownOptions } from '../../../../base-ui/dropdown';

export type BedFormData = z.infer<typeof formSchema>;

export const formSchema = z.object({
  accessibility: z.array(z.enum(AccessibilityChoices)),
  b7: z.boolean(),
  demographics: z.array(z.enum(DemographicChoices)),
  fees: z
    .number()
    .int('Fees must be a whole number')
    .min(0, 'Fees must be zero or greater')
    .nullable(),
  funders: z.array(z.enum(FunderChoices)),
  maintenanceFlag: z.boolean(),
  medicalNeeds: z.array(z.enum(MedicalNeedChoices)),
  name: z.string(),
  pets: z.array(z.enum(PetChoices)),
  roomId: z.string().nullable(),
  statusNotes: z.string(),
  storage: z.boolean(),
  type: z.enum(BedTypeChoices).nullable(),
});

const BED_TYPE_LABELS: Record<BedTypeChoices, string> = {
  [BedTypeChoices.Twin]: 'Twin',
  [BedTypeChoices.Bunk]: 'Bunk',
  [BedTypeChoices.Rollaway]: 'Rollaway',
  [BedTypeChoices.Other]: 'Other',
};

const MEDICAL_NEED_LABELS: Record<MedicalNeedChoices, string> = {
  [MedicalNeedChoices.Erc]: 'ERC (Enrich Residential Care)',
  [MedicalNeedChoices.Dmh]: 'DMH Beds (Dept of Mental Health)',
  [MedicalNeedChoices.Oxygen]: 'Oxygen',
  [MedicalNeedChoices.Dialysis]: 'Dialysis',
};

export const BED_TYPE_OPTIONS = toDropdownOptions(BED_TYPE_LABELS);
export const MEDICAL_NEED_OPTIONS = toDropdownOptions(MEDICAL_NEED_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

export const createEmptyBedFormData = (): BedFormData => ({
  accessibility: [],
  b7: false,
  demographics: [],
  fees: null,
  funders: [],
  maintenanceFlag: false,
  medicalNeeds: [],
  name: '',
  pets: [],
  roomId: null,
  statusNotes: '',
  storage: false,
  type: null,
});

function toChoiceNames<T extends string>(
  items: ReadonlyArray<{ name?: T | null }> | undefined,
): T[] {
  return (
    items?.map((item) => item.name).filter((name): name is T => name != null) ??
    []
  );
}

export function toFormData(bed: UseBedResultType): BedFormData {
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
    statusNotes: bed.statusNotes ?? '',
    storage: bed.storage ?? defaults.storage,
    type: bed.type ?? null,
  };
}
