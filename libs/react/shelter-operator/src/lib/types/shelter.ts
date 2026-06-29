export type BedsByStatus = {
  available: number;
  inTurnaround: number;
  occupied: number;
  outOfService: number;
  reserved: number;
};

export type Shelter = {
  id: string;
  name: string | null;
  address: string | null;
  totalBeds: number | null;
  bedsByStatus: BedsByStatus;
  tags: string[] | null;
  status: string;
};
