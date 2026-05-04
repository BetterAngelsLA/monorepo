import type { ReservationLayoutStyle } from '../../components/BedTable';

export interface ReservationClient {
  clientProfileId: string;
  isPrimary: boolean;
}

export interface ReservationFormData {
  clients: ReservationClient[];
  shelterId: string;
  roomId: string | null;
  bedId: string | null;
  startDate: string | null;
  reservationLayoutStyle: ReservationLayoutStyle;
}
