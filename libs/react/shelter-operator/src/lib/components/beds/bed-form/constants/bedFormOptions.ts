import {
  BedStatusChoices,
  BedTypeChoices,
  MedicalNeedChoices,
} from '@monorepo/ba-platform/types';
import { toDropdownOptions } from '../../../base-ui/dropdown';

const BED_STATUS_LABELS: Record<BedStatusChoices, string> = {
  [BedStatusChoices.Available]: 'Available',
  [BedStatusChoices.InTurnaround]: 'In Turnaround',
  [BedStatusChoices.Occupied]: 'Occupied',
  [BedStatusChoices.OutOfService]: 'Out of Service',
  [BedStatusChoices.Reserved]: 'Reserved',
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

export const BED_STATUS_OPTIONS = toDropdownOptions(BED_STATUS_LABELS);
export const BED_TYPE_OPTIONS = toDropdownOptions(BED_TYPE_LABELS);
export const MEDICAL_NEED_OPTIONS = toDropdownOptions(MEDICAL_NEED_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;
