import { getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationStatusChoices } from '../../apollo/graphql/__generated__/types';
import { useReservations } from '../../hooks/useReservations';
import { useUpdateReservation } from '../../hooks/useUpdateReservation';
import { updateReservationMeta } from '../../hooks/useUpdateReservation/__generated__/useUpdateReservation_meta.generated';
import { shelterCreateReservationRoute } from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { useToast } from '../base-ui/toast';
import { ReservationTable } from '../ReservationTable';

type LoadingAction = 'checkin' | 'complete' | 'cancel' | null;

export function ReservationsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { reservations, loading } = useReservations(shelterId);

  const { updateReservation } = useUpdateReservation({ shelterId });

  const [actionError, setActionError] = useState<string | null>(null);

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
  const { showToast } = useToast();

  const handleStatusUpdate = useCallback(
    async (
      reservationId: string,
      status: ReservationStatusChoices,
      action: LoadingAction,
      onClose: () => void,
    ) => {
      const errorMessage = 'Unable to update reservation. Please try again.';
      setActionError(null);
      setLoadingAction(action);
      try {
        const response = await updateReservation({
          variables: { id: reservationId, data: { status } },
        });
        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateReservationMeta,
          fields: ['ids'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error updating reservation: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      } finally {
        setLoadingAction(null);
      }
      onClose();
    },
    [updateReservation],
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
          className="mb-4 flex items-start rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span className="flex-1">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      <div>
        <ReservationTable
          reservations={reservations}
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
                closeCheckinConfirmation,
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
                closeCompleteConfirmation,
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
                closeCancelConfirmation,
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
