import type { UseReservationResultType } from '../../../../hooks/useReservation';
import type { SelectedClient } from '../../components/ClientSearchInput';
import { createEmptyReservationFormData } from '../constants/defaultReservationFormData';
import type { ReservationFormData } from '../formTypes';

export function mapReservationToFormData(reservation: UseReservationResultType): ReservationFormData {
  const defaults = createEmptyReservationFormData();
  const primaryAssignment = reservation.clients.find((c) => c.isPrimary);

  return {
    ...defaults,
    bedId: reservation.bed?.id ?? null,
    roomId: reservation.room?.id ?? null,
    clientIds: reservation.clients.map((c) => c.clientProfile.id),
    primaryClientId: primaryAssignment?.clientProfile.id ?? null,
    status: reservation.status ?? defaults.status,
    startDate: reservation.startDate ?? '',
    notes: reservation.notes ?? '',
  };
}

export function mapReservationClientsToSelectedClients(
  reservation: UseReservationResultType
): SelectedClient[] {
  return reservation.clients.map((c) => ({
    id: c.clientProfile.id,
    firstName: c.clientProfile.firstName,
    middleName: c.clientProfile.middleName,
    lastName: c.clientProfile.lastName,
    nickname: c.clientProfile.nickname,
  }));
}
