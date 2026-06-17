import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback, useState } from 'react';

const CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($data: CreateOrganizationInput!) {
    createOrganization(data: $data) {
      user { id email firstName lastName }
      organization { id name }
    }
  }
`;

interface UseCreateOrganizationReturn {
  createOrganization: (orgName: string) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateOrganization(): UseCreateOrganizationReturn {
  const [mutate] = useMutation(CREATE_ORGANIZATION_MUTATION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrganization = useCallback(
    async (orgName: string): Promise<boolean> => {
      if (!orgName.trim()) return false;
      setSubmitting(true);
      setError(null);
      try {
        await mutate({
          variables: { data: { organizationName: orgName.trim() } },
        });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create organization.';
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [mutate]
  );

  const clearError = useCallback(() => setError(null), []);

  return { createOrganization, submitting, error, clearError };
}
