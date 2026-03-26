export type Shelter = {
  id: string;
  name: string | null;
  address: string | null;
  totalBeds: number | null;
  availableBeds: number | null;
  tags: string[] | null;
};
