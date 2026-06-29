import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback, useState } from 'react';

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

export function useCreateReservation(): UseCreateReservationReturn {
  const [mutate] = useMutation(CREATE_RESERVATION_MUTATION);
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
