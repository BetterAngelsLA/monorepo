import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { ReservationForm } from '../../components/reservations/reservation-form/ReservationForm';
import { createEmptyReservationFormData } from '../../components/reservations/reservation-form/constants/defaultReservationFormData';
import {
  mapReservationClientsToSelectedClients,
  mapReservationToFormData,
} from '../../components/reservations/reservation-form/utils/mapReservationToFormData';
import { useReservation } from '../../hooks/useReservation';
import {
  shelterManageReservationsRoute,
  shelterManageRoomsRoute,
  shelterOperationsRoute,
  shelterOperationsSegments,
} from '../../routing';

export function ReservationFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shelterId, reservationId } = useParams();
  const { reservation, loading, error } = useReservation(reservationId ?? '');

  const rawState = location.state as Record<string, unknown> | null | undefined;
  const bedId =
    typeof rawState?.bedId === 'string' ? rawState.bedId : undefined;
  const roomId =
    typeof rawState?.roomId === 'string' ? rawState.roomId : undefined;

  const { backLinkPath, backLinkLabel } = useMemo(() => {
    if (bedId) {
      return {
        backLinkPath: shelterOperationsRoute(
          shelterId ?? '',
          shelterOperationsSegments.beds,
        ),
        backLinkLabel: 'Back to Beds',
      };
    }
    if (roomId) {
      return {
        backLinkPath: shelterManageRoomsRoute(shelterId ?? ''),
        backLinkLabel: 'Back to Rooms',
      };
    }
    return {
      backLinkPath: shelterManageReservationsRoute(shelterId ?? ''),
      backLinkLabel: 'Back to Reservations',
    };
  }, [bedId, roomId, shelterId]);

  const { initialData, readOnlyFields } = useMemo(() => {
    const defaults = createEmptyReservationFormData();
    const readOnlyFields: ('bedId' | 'roomId')[] = [];

    if (reservationId && reservation) {
      return {
        initialData: mapReservationToFormData(reservation),
        readOnlyFields,
      };
    }
    if (!reservationId && bedId) {
      readOnlyFields.push('bedId', 'roomId');
      return {
        initialData: {
          ...defaults,
          bedId,
          roomId: roomId || null,
        },
        readOnlyFields,
      };
    }
    if (!reservationId && roomId) {
      readOnlyFields.push('roomId');
      return {
        initialData: {
          ...defaults,
          roomId,
        },
        readOnlyFields,
      };
    }
    return { initialData: undefined, readOnlyFields };
  }, [reservationId, reservation, bedId, roomId]);

  const initialSelectedClients =
    reservationId && reservation
      ? mapReservationClientsToSelectedClients(reservation)
      : undefined;

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={backLinkPath}
      backLinkLabel={backLinkLabel}
      entityId={reservationId}
      loading={loading}
      hasError={!!(reservationId && (error || !reservation))}
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
        onSuccess={() => navigate(backLinkPath)}
        onCancel={() => navigate(backLinkPath)}
      />
    </ManageFormPageLayout>
  );
}
