import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { GetRoomsDocument } from '../components/rooms/api/__generated__/roomQueries.generated';
import { BedsDocument } from './useBeds/__generated__/useBeds.generated';
import { GetReservationsDocument } from './useReservations/__generated__/useReservations.generated';

const CREATE_RESERVATION_MUTATION = gql`
  mutation CreateReservation($data: CreateReservationInput!) {
    createReservation(data: $data) {
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

interface UseCreateReservationReturn {
  createReservation: (data: Record<string, unknown>) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateReservation(
  shelterId: string
): UseCreateReservationReturn {
  const refetchQueries = useMemo(
    () => [
      { query: BedsDocument, variables: { shelterId } },
      { query: GetRoomsDocument, variables: { shelterId } },
      { query: GetReservationsDocument, variables: { shelterId } },
    ],
    [shelterId]
  );

  const [mutate] = useMutation(CREATE_RESERVATION_MUTATION, { refetchQueries });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = useCallback(
    async (data: Record<string, unknown>): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await mutate({ variables: { data } });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create reservation.';
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [mutate]
  );

  const clearError = useCallback(() => setError(null), []);

  return { createReservation, submitting, error, clearError };
}
