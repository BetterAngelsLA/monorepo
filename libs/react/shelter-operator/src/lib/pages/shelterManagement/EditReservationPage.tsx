import { useNavigate, useParams } from 'react-router-dom';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import {
  ReservationForm,
  toReservationFormData as toFormData,
  toSelectedClients,
} from '../../components/ShelterManagement';
import { useReservation } from '../../hooks';
import { shelterMgmtResourceRoute } from '../../routing';

export function EditReservationPage() {
  const navigate = useNavigate();
  const { shelterId, id: reservationId } = useParams<{
    shelterId: string;
    id: string;
  }>();

  if (!shelterId || !reservationId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { reservation, loading, error } = useReservation(reservationId);
  const reservationsPath = shelterMgmtResourceRoute(shelterId, 'reservation');

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
        shelterId={shelterId}
        reservationId={reservationId}
        initialData={reservation ? toFormData(reservation) : undefined}
        initialSelectedClients={
          reservation ? toSelectedClients(reservation) : undefined
        }
        onSuccess={() => navigate(reservationsPath)}
        onCancel={() => navigate(reservationsPath)}
      />
    </ManageFormPageLayout>
  );
}
