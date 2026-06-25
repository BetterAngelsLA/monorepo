import { RoomStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import { toDropdownOptions } from '../../../base-ui/dropdown';

const ROOM_STATUS_LABELS: Record<RoomStatusChoices, string> = {
  [RoomStatusChoices.Available]: 'Available',
  [RoomStatusChoices.OutOfService]: 'Out of Service',
  [RoomStatusChoices.InTurnaround]: 'In Turnaround',
  [RoomStatusChoices.Occupied]: 'Occupied',
  [RoomStatusChoices.Reserved]: 'Reserved',
};

export const ROOM_STATUS_OPTIONS = toDropdownOptions(ROOM_STATUS_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;
