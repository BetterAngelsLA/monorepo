export type BedCounts = {
  available: number;
  inTurnaround: number;
  occupied: number;
  outOfService: number;
  reserved: number;
  total: number;
};

export type Shelter = {
  id: string;
  address: string | null;
  bedCounts: BedCounts;
  name: string | null;
  status: string;
  tags: string[] | null;
  totalBeds: number | null;
};
