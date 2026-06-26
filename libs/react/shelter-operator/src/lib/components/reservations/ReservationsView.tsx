import { useMutation, useQuery } from '@apollo/client/react';
import { isMutationSuccess } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationStatusChoices } from '../../apollo/graphql/__generated__/types';
import { shelterCreateReservationRoute } from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { GetBedsDocument } from '../beds/api/__generated__/bedQueries.generated';
import { ReservationTable } from '../ReservationTable';
import { GetRoomsDocument } from '../rooms/api/__generated__/roomQueries.generated';
import {
  GetReservationsDocument,
  type GetReservationsQuery,
  type GetReservationsQueryVariables,
} from './api/__generated__/reservationQueries.generated';
import {
  UpdateReservationDocument,
  type UpdateReservationMutation,
  type UpdateReservationMutationVariables,
} from './api/updateReservationMutation';

export function ReservationsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading } = useQuery<
    GetReservationsQuery,
    GetReservationsQueryVariables
  >(GetReservationsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const refetchQueries = useMemo(
    () => [
      { query: GetBedsDocument, variables: { shelterId } },
      { query: GetRoomsDocument, variables: { shelterId } },
      { query: GetReservationsDocument, variables: { shelterId } },
    ],
    [shelterId]
  );

  const [updateReservation] = useMutation<
    UpdateReservationMutation,
    UpdateReservationMutationVariables
  >(UpdateReservationDocument, { refetchQueries });

  const [loadingAction, setLoadingAction] = useState<
    'checkin' | 'complete' | 'cancel' | null
  >(null);
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
      action: 'checkin' | 'complete' | 'cancel',
      errorVerb: string,
      onClose: () => void
    ) => {
      setActionError(null);
      setLoadingAction(action);
      try {
        const { data: result } = await updateReservation({
          variables: { id: reservationId, data: { status } },
          errorPolicy: 'all',
        });

        if (result?.updateReservation?.__typename === 'OperationInfo') {
          const firstMessage = result.updateReservation.messages?.[0]?.message;
          setActionError(
            firstMessage ||
              `Unable to ${errorVerb} reservation. Please try again.`
          );
          return;
        }
        if (!isMutationSuccess(result?.updateReservation, 'ReservationType')) {
          setActionError('An unexpected error occurred. Please try again.');
          return;
        }
      } catch {
        setActionError('A network error occurred. Please try again.');
      } finally {
        setLoadingAction(null);
        onClose();
      }
    },
    [updateReservation]
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

  const rows = data?.reservations.results ?? [];

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
                'check in',
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
