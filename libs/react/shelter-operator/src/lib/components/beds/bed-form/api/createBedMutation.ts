import type {
  CreateBedInput,
  UpdateBedInput,
} from '../../../../apollo/graphql/__generated__/types';
import type { BedFormData } from '../formTypes';
import {
  CreateBedDocument,
  type CreateBedMutation,
  type CreateBedMutationVariables,
} from './__generated__/createBedMutation.generated';

export { CreateBedDocument as CREATE_BED_MUTATION };
export type {
  CreateBedMutation as CreateBedMutationResult,
  CreateBedMutationVariables,
};

const compactEnumValues = <T extends string>(values: readonly T[]): T[] =>
  Array.from(new Set(values.filter(Boolean)));

const sanitizeString = (value?: string | null): string | undefined => {
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
  name: sanitizeString(formData.name),
  status: formData.status ?? undefined,
  statusNotes: sanitizeString(formData.statusNotes),
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
