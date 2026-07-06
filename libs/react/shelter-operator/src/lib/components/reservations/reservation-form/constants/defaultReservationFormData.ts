import { ReservationStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import type { ReservationFormData } from '../formTypes';

/** Fresh copy of reservation form defaults to avoid shared mutable state. */
export const createEmptyReservationFormData = (): ReservationFormData => ({
  bedId: null,
  roomId: null,
  clientIds: [],
  primaryClientId: null,
  status: ReservationStatusChoices.Confirmed,
  startDate: '',
  notes: '',
});
