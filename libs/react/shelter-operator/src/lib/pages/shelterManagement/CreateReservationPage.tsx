import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import {
  createEmptyReservationFormData,
  ReservationForm,
} from '../../components/ShelterManagement';
import { shelterMgmtResourceRoute } from '../../routing';

export function CreateReservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const rawState = location.state as Record<string, unknown> | null | undefined;
  const bedId =
    typeof rawState?.bedId === 'string' ? rawState.bedId : undefined;
  const roomId =
    typeof rawState?.roomId === 'string' ? rawState.roomId : undefined;

  const { backLinkPath, backLinkLabel } = useMemo(() => {
    if (bedId) {
      return {
        backLinkPath: shelterMgmtResourceRoute(shelterId, 'bed'),
        backLinkLabel: 'Back to Beds',
      };
    }
    if (roomId) {
      return {
        backLinkPath: shelterMgmtResourceRoute(shelterId, 'room'),
        backLinkLabel: 'Back to Rooms',
      };
    }
    return {
      backLinkPath: shelterMgmtResourceRoute(shelterId, 'reservation'),
      backLinkLabel: 'Back to Reservations',
    };
  }, [bedId, roomId, shelterId]);

  const { initialData, readOnlyFields } = useMemo(() => {
    const defaults = createEmptyReservationFormData();
    const readOnly: ('bedId' | 'roomId')[] = [];

    if (bedId) {
      readOnly.push('bedId', 'roomId');
      return {
        initialData: {
          ...defaults,
          bedId,
          roomId: roomId || null,
        },
        readOnlyFields: readOnly,
      };
    }
    if (roomId) {
      readOnly.push('roomId');
      return {
        initialData: {
          ...defaults,
          roomId,
        },
        readOnlyFields: readOnly,
      };
    }
    return { initialData: undefined, readOnlyFields: readOnly };
  }, [bedId, roomId]);

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={backLinkPath}
      backLinkLabel={backLinkLabel}
      entityId={undefined}
      loading={false}
      hasError={false}
      entityName="reservation"
      entityLabel="Reservation"
    >
      <ReservationForm
        shelterId={shelterId}
        initialData={initialData}
        readOnlyFields={readOnlyFields}
        onSuccess={() => navigate(backLinkPath)}
        onCancel={() => navigate(backLinkPath)}
      />
    </ManageFormPageLayout>
  );
}
