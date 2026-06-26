import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReservationForm } from '../../components/reservations/reservation-form/ReservationForm';
import { createEmptyReservationFormData } from '../../components/reservations/reservation-form/constants/defaultReservationFormData';
import type { ReservationFormData } from '../../components/reservations/reservation-form/formTypes';
import {
  mapReservationClientsToSelectedClients,
  mapReservationToFormData,
} from '../../components/reservations/reservation-form/utils/mapReservationToFormData';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { useReservation } from '../../hooks/useReservation';
import { shelterManageReservationsRoute } from '../../routing';

interface ReservationLocationState {
  bedId?: string | null;
  roomId?: string | null;
}

export function EditReservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shelterId, reservationId } = useParams();
  const { reservation, loading, error } = useReservation(
    reservationId ? reservationId : ''
  );

  const reservationsPath = shelterManageReservationsRoute(shelterId ?? '');

  const state = (location.state ?? {}) as ReservationLocationState;

  const defaults = createEmptyReservationFormData();
  let initialData: ReservationFormData | undefined;
  const readOnlyFields: ('bedId' | 'roomId')[] = [];

  if (reservationId && reservation) {
    initialData = mapReservationToFormData(reservation);
  } else if (!reservationId && state.bedId) {
    initialData = {
      ...defaults,
      bedId: state.bedId,
      roomId: state.roomId || null,
    };
    readOnlyFields.push('bedId', 'roomId');
  } else if (!reservationId && state.roomId) {
    initialData = {
      ...defaults,
      roomId: state.roomId,
    };
    readOnlyFields.push('roomId');
  }

  const initialSelectedClients =
    reservationId && reservation
      ? mapReservationClientsToSelectedClients(reservation)
      : undefined;

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={reservationsPath}
      backLinkLabel="Back to Reservations"
      entityId={reservationId}
      loading={loading}
      hasError={!!(error || !reservation)}
      errorMessage={
        error ? 'Unable to load this reservation.' : 'Reservation not found.'
      }
      entityName="reservation"
      entityLabel="Reservation"
    >
      <ReservationForm
        key={reservationId}
        shelterId={shelterId ?? ''}
        reservationId={reservationId ? reservationId : undefined}
        initialData={initialData}
        initialSelectedClients={initialSelectedClients}
        readOnlyFields={readOnlyFields}
        onSuccess={() => navigate(reservationsPath)}
        onCancel={() => navigate(reservationsPath)}
      />
    </ManageFormPageLayout>
  );
}
