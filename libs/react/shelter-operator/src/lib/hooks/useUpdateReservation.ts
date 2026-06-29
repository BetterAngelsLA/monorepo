import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback, useState } from 'react';

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

export function useUpdateReservation(): UseUpdateReservationReturn {
  const [mutate] = useMutation(UPDATE_RESERVATION_MUTATION);
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
