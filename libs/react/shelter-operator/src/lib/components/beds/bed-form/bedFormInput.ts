import type {
  CreateBedInput,
  UpdateBedInput,
} from '../../../apollo/graphql/__generated__/types';
import type { BedFormData } from './formTypes';

const compactEnumValues = <T extends string>(values: readonly T[]): T[] =>
  Array.from(new Set(values.filter(Boolean)));

const toInputString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const numberOrUndefined = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

const buildBedFieldInput = (formData: BedFormData) => ({
  roomId: formData.roomId ?? undefined,
  b7: formData.b7,
  fees: numberOrUndefined(formData.fees),
  maintenanceFlag: formData.maintenanceFlag,
  name: toInputString(formData.name),
  statusNotes: toInputString(formData.statusNotes),
  storage: formData.storage,
  type: formData.type ?? undefined,
  accessibility: compactEnumValues(formData.accessibility).length
    ? compactEnumValues(formData.accessibility)
    : undefined,
  demographics: compactEnumValues(formData.demographics).length
    ? compactEnumValues(formData.demographics)
    : undefined,
  funders: compactEnumValues(formData.funders).length
    ? compactEnumValues(formData.funders)
    : undefined,
  medicalNeeds: compactEnumValues(formData.medicalNeeds).length
    ? compactEnumValues(formData.medicalNeeds)
    : undefined,
  pets: compactEnumValues(formData.pets).length
    ? compactEnumValues(formData.pets)
    : undefined,
});

export const buildCreateBedInput = (
  formData: BedFormData,
  shelterId: string
): CreateBedInput => ({
  shelterId,
  ...buildBedFieldInput(formData),
});

export const buildUpdateBedInput = (formData: BedFormData): UpdateBedInput =>
  buildBedFieldInput(formData);
