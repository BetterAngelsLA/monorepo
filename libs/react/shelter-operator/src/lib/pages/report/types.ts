/**
 * Shape of the data rendered into the shelter PDF report.
 *
 * Mirrors the `adminShelter` fields already fetched by
 * `components/overview/OverviewView.tsx` so this can later be wired to the same
 * `GetAdminShelterOverview` query instead of mock data.
 */
export interface ShelterReportData {
  name: string;
  organization: {
    name: string;
  };
  location: {
    place: string;
  };
  bedsByStatus: {
    available: number;
    occupied: number;
    reserved: number;
    outOfService: number;
  };
  roomsByStatus: {
    available: number;
    reserved: number;
    needsMaintenance: number;
  };
}
