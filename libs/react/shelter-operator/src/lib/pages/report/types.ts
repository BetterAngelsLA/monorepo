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
