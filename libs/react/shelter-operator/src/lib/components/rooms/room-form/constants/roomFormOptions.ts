import { RoomStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import type { DropdownOption } from '../../../base-ui/dropdown';

const toOptions = <T extends string>(
  labels: Record<T, string>
): DropdownOption<T>[] =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));

const ROOM_STATUS_LABELS: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'Available',
  [RoomStatusChoices.NeedsMaintenance]: 'Out of Service',
  [RoomStatusChoices.Reserved]: 'Reserved',
};

export const ROOM_STATUS_OPTIONS = toOptions(ROOM_STATUS_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;
