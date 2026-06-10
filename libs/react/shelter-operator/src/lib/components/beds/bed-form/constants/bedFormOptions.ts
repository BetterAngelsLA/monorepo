import {
  BedStatusChoices,
  BedTypeChoices,
  MedicalNeedChoices,
} from '../../../../apollo/graphql/__generated__/types';
import type { DropdownOption } from '../../../base-ui/dropdown';

const toOptions = <T extends string>(
  labels: Record<T, string>
): DropdownOption<T>[] =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));

const BED_STATUS_LABELS: Record<BedStatusChoices, string> = {
  [BedStatusChoices.Available]: 'Available',
  [BedStatusChoices.Occupied]: 'Occupied',
  [BedStatusChoices.Reserved]: 'Reserved',
  [BedStatusChoices.OutOfService]: 'Out-of-Service',
};

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

export const BED_STATUS_OPTIONS = toOptions(BED_STATUS_LABELS);
export const BED_TYPE_OPTIONS = toOptions(BED_TYPE_LABELS);
export const MEDICAL_NEED_OPTIONS = toOptions(MEDICAL_NEED_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;
