import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback, useState } from 'react';

const DELETE_RESERVATIONS_MUTATION = gql`
  mutation DeleteReservations($data: BulkDeleteInput!) {
    deleteReservations(data: $data) {
      ... on BulkDeleteResult {
        ids
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

interface UseDeleteReservationsReturn {
  deleteReservations: (ids: string[]) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDeleteReservations(): UseDeleteReservationsReturn {
  const [mutate] = useMutation(DELETE_RESERVATIONS_MUTATION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReservations = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids.length) return false;
      setSubmitting(true);
      setError(null);
      try {
        await mutate({ variables: { data: { ids } } });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete reservations.';
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [mutate]
  );

  const clearError = useCallback(() => setError(null), []);

  return { deleteReservations, submitting, error, clearError };
}
