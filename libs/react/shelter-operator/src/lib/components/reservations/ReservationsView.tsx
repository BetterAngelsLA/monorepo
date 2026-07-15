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
type ReservationAction = NonNullable<LoadingAction>;

const ACTION_CONFIG: Record<
  ReservationAction,
  {
    variant: 'success' | 'danger';
    title: string;
    primaryLabel: string;
    loadingLabel: string;
    status: ReservationStatusChoices;
  }
> = {
  checkin: {
    variant: 'success',
    title: 'Are you sure you want to mark this reservation as checked in?',
    primaryLabel: 'Check In',
    loadingLabel: 'Checking In…',
    status: ReservationStatusChoices.CheckedIn,
  },
  complete: {
    variant: 'success',
    title: 'Are you sure you want to mark this reservation as completed?',
    primaryLabel: 'Complete',
    loadingLabel: 'Completing…',
    status: ReservationStatusChoices.Completed,
  },
  cancel: {
    variant: 'danger',
    title: 'Are you sure you want to cancel this reservation?',
    primaryLabel: 'Cancel Reservation',
    loadingLabel: 'Cancelling…',
    status: ReservationStatusChoices.Cancelled,
  },
};

export function ReservationsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { reservations, loading } = useReservations(shelterId);

  const { updateReservation } = useUpdateReservation({ shelterId });

  const [actionError, setActionError] = useState<string | null>(null);

  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    reservationId: string | null;
    action: ReservationAction | null;
  }>({ isOpen: false, reservationId: null, action: null });
  const confirmationAction = confirmation.action;

  const closeConfirmation = useCallback(() => {
    setConfirmation({ isOpen: false, reservationId: null, action: null });
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
    [updateReservation, showToast],
  );

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
          isConfirmActionLoading={
            loadingAction === 'checkin' || loadingAction === 'complete'
          }
          isCancelActionLoading={loadingAction === 'cancel'}
          onCheckIn={(id) =>
            setConfirmation({
              isOpen: true,
              reservationId: id,
              action: 'checkin',
            })
          }
          onComplete={(id) =>
            setConfirmation({
              isOpen: true,
              reservationId: id,
              action: 'complete',
            })
          }
          onCancel={(id) =>
            setConfirmation({
              isOpen: true,
              reservationId: id,
              action: 'cancel',
            })
          }
        />
      </div>
      {confirmationAction && (
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={closeConfirmation}
          variant={ACTION_CONFIG[confirmationAction].variant}
          title={ACTION_CONFIG[confirmationAction].title}
          description=""
          primaryAction={{
            label:
              loadingAction === confirmationAction
                ? ACTION_CONFIG[confirmationAction].loadingLabel
                : ACTION_CONFIG[confirmationAction].primaryLabel,
            onClick: () => {
              if (confirmation.reservationId) {
                handleStatusUpdate(
                  confirmation.reservationId,
                  ACTION_CONFIG[confirmationAction].status,
                  confirmationAction,
                  closeConfirmation,
                );
              }
            },
            isLoading: loadingAction === confirmationAction,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeConfirmation,
          }}
        />
      )}

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
