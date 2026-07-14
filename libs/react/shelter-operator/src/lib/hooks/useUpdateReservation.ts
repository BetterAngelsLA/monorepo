import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { BedsDocument } from './useBeds/__generated__/useBeds.generated';
import { GetReservationsDocument } from './useReservations/__generated__/useReservations.generated';
import { RoomsDocument } from './useRooms/__generated__/useRooms.generated';

const UPDATE_RESERVATION_MUTATION = gql`
  mutation UpdateReservation($id: ID!, $data: UpdateReservationInput!) {
    updateReservation(id: $id, data: $data) {
      ... on ReservationType {
        id
        status
        startDate
        notes
        bed {
          id
          name
        }
        room {
          id
          name
        }
      }
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
    }
  }
`;

interface UseUpdateReservationReturn {
  updateReservation: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUpdateReservation(
  shelterId: string
): UseUpdateReservationReturn {
  const refetchQueries = useMemo(
    () => [
      { query: BedsDocument, variables: { shelterId } },
      { query: RoomsDocument, variables: { shelterId } },
      { query: GetReservationsDocument, variables: { shelterId } },
    ],
    [shelterId]
  );

  const [mutate] = useMutation(UPDATE_RESERVATION_MUTATION, { refetchQueries });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReservation = useCallback(
    async (id: string, data: Record<string, unknown>): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await mutate({ variables: { id, data } });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to update reservation.';
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [mutate]
  );

  const clearError = useCallback(() => setError(null), []);

  return { updateReservation, submitting, error, clearError };
}
