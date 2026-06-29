import type {
  CreateRoomInput,
  UpdateRoomInput,
} from '../../../apollo/graphql/__generated__/types';
import type { RoomFormData } from '../room-form/formTypes';

const compactEnumValues = <T extends string>(values: readonly T[]): T[] =>
  Array.from(new Set(values.filter(Boolean)));

const toInputString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const buildRoomFieldInput = (formData: RoomFormData) => ({
  name: toInputString(formData.name),
  type: formData.type ?? undefined,
  typeOther: toInputString(formData.typeOther),
  notes: toInputString(formData.notes),
  amenities: toInputString(formData.amenities),
  medicalRespite: formData.medicalRespite,
  maintenanceFlag: formData.maintenanceFlag,
  storage: formData.storage,
  accessibility: compactEnumValues(formData.accessibility).length
    ? compactEnumValues(formData.accessibility)
    : undefined,
  demographics: compactEnumValues(formData.demographics).length
    ? compactEnumValues(formData.demographics)
    : undefined,
  funders: compactEnumValues(formData.funders).length
    ? compactEnumValues(formData.funders)
    : undefined,
  pets: compactEnumValues(formData.pets).length
    ? compactEnumValues(formData.pets)
    : undefined,
});

export const buildCreateRoomInput = (
  formData: RoomFormData,
  shelterId: string
): CreateRoomInput => ({
  shelterId,
  ...buildRoomFieldInput(formData),
  name: toInputString(formData.name) ?? '',
});

export const buildUpdateRoomInput = (formData: RoomFormData): UpdateRoomInput =>
  buildRoomFieldInput(formData);
