import type { BedStatusChoices } from '../apollo/graphql/__generated__/types';

export type BedListItem = {
  id: string;
  bedName: string;
  status?: BedStatusChoices | null;
  maintenanceFlag?: boolean;
  tags?: string[] | null;
};

export type BedRoomForList = {
  id: string;
  roomLabel: string;
  beds: BedListItem[];
};

export type BedRowObject = {
  bedId: string;
  bedName: string;
  status?: BedStatusChoices | null;
  roomAssignment: string;
  tags: string[];
};
