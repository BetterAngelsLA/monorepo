import { ShelterReportData } from './types';

/** Stand-in report data for the spike; replace with a real `useQuery` later. */
export const mockReport: ShelterReportData = {
  name: 'Riverside Emergency Shelter',
  organization: {
    name: 'City Outreach Network',
  },
  location: {
    place: '482 Riverside Ave, Springfield',
  },
  bedsByStatus: {
    available: 18,
    occupied: 42,
    reserved: 6,
    outOfService: 4,
  },
  roomsByStatus: {
    available: 5,
    reserved: 2,
    needsMaintenance: 1,
  },
};
