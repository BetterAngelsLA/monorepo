import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationStatusChoices } from '@monorepo/ba-platform/types';
import { useReservations } from '../../hooks/useReservations';
import { useUpdateReservation } from '../../hooks/useUpdateReservation';
import { shelterCreateReservationRoute } from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { ReservationTable } from '../ReservationTable';

type LoadingAction = 'checkin' | 'complete' | 'cancel' | null;

export function ReservationsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { reservations: rows, loading } = useReservations(shelterId);

  const {
    updateReservation,
    error: actionError,
    clearError,
  } = useUpdateReservation(shelterId);

  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const isCheckingIn = loadingAction === 'checkin';
  const isCompleting = loadingAction === 'complete';
  const isCancelling = loadingAction === 'cancel';

  const [checkinConfirmation, setCheckinConfirmation] = useState<{
    isOpen: boolean;
    reservationId: string | null;
  }>({ isOpen: false, reservationId: null });

  const closeCheckinConfirmation = useCallback(() => {
    setCheckinConfirmation({ isOpen: false, reservationId: null });
  }, []);

  const handleStatusUpdate = useCallback(
    async (
      reservationId: string,
      status: ReservationStatusChoices,
      action: LoadingAction,
      onClose: () => void
    ) => {
      clearError();
      setLoadingAction(action);
      await updateReservation(reservationId, { status });
      setLoadingAction(null);
      onClose();
    },
    [updateReservation, clearError]
  );

  const [completeConfirmation, setCompleteConfirmation] = useState<{
    isOpen: boolean;
    reservationId: string | null;
  }>({ isOpen: false, reservationId: null });

  const closeCompleteConfirmation = useCallback(() => {
    setCompleteConfirmation({ isOpen: false, reservationId: null });
  }, []);

  const [cancelConfirmation, setCancelConfirmation] = useState<{
    isOpen: boolean;
    reservationId: string | null;
  }>({ isOpen: false, reservationId: null });

  const closeCancelConfirmation = useCallback(() => {
    setCancelConfirmation({ isOpen: false, reservationId: null });
  }, []);

  return (
    <div>
      {actionError && (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}
      <div>
        <ReservationTable
          rows={rows}
          shelterId={shelterId}
          loading={loading}
          isConfirmActionLoading={isCheckingIn || isCompleting}
          isCancelActionLoading={isCancelling}
          onCheckIn={(id) =>
            setCheckinConfirmation({ isOpen: true, reservationId: id })
          }
          onComplete={(id) =>
            setCompleteConfirmation({ isOpen: true, reservationId: id })
          }
          onCancel={(id) =>
            setCancelConfirmation({ isOpen: true, reservationId: id })
          }
        />
      </div>
      <ConfirmationModal
        isOpen={checkinConfirmation.isOpen}
        onClose={closeCheckinConfirmation}
        variant="success"
        title="Are you sure you want to mark this reservation as checked in?"
        description=""
        primaryAction={{
          label: isCheckingIn ? 'Checking In…' : 'Check In',
          onClick: () => {
            if (checkinConfirmation.reservationId) {
              handleStatusUpdate(
                checkinConfirmation.reservationId,
                ReservationStatusChoices.CheckedIn,
                'checkin',
                closeCheckinConfirmation
              );
            }
          },
          isLoading: isCheckingIn,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeCheckinConfirmation,
        }}
      />

      <ConfirmationModal
        isOpen={completeConfirmation.isOpen}
        onClose={closeCompleteConfirmation}
        variant="success"
        title="Are you sure you want to mark this reservation as completed?"
        description=""
        primaryAction={{
          label: isCompleting ? 'Completing…' : 'Complete',
          onClick: () => {
            if (completeConfirmation.reservationId) {
              handleStatusUpdate(
                completeConfirmation.reservationId,
                ReservationStatusChoices.Completed,
                'complete',
                closeCompleteConfirmation
              );
            }
          },
          isLoading: isCompleting,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeCompleteConfirmation,
        }}
      />

      <ConfirmationModal
        isOpen={cancelConfirmation.isOpen}
        onClose={closeCancelConfirmation}
        variant="danger"
        title="Are you sure you want to cancel this reservation?"
        description=""
        primaryAction={{
          label: isCancelling ? 'Cancelling…' : 'Cancel Reservation',
          onClick: () => {
            if (cancelConfirmation.reservationId) {
              handleStatusUpdate(
                cancelConfirmation.reservationId,
                ReservationStatusChoices.Cancelled,
                'cancel',
                closeCancelConfirmation
              );
            }
          },
          isLoading: isCancelling,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeCancelConfirmation,
        }}
      />

      <div className="fixed bottom-6 right-6 text-sm z-20 ">
        <Button
          leftIcon={<Plus />}
          rightIcon={false}
          variant="floating"
          onClick={() => navigate(shelterCreateReservationRoute(shelterId))}
        >
          Create Reservation
        </Button>
      </div>
    </div>
  );
}
