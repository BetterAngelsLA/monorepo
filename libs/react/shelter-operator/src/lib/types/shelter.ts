export type Shelter = {
  id: string;
  name: string | null;
  address: string | null;
  totalBeds: number | null;
  occupiedBeds?: number | null;
  tags: string[] | null;
};
