import { useMutation } from '@apollo/client/react';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { useCallback } from 'react';

type LogoutMutation = { __typename?: 'Mutation'; logout: boolean };
type LogoutMutationVariables = Record<string, never>;

const LogoutDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'logout' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'logout' } }],
      },
    },
  ],
} as unknown as TypedDocumentNode<LogoutMutation, LogoutMutationVariables>;

export function useSignOut(setUser: (user: undefined) => void) {
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser]);

  return { signOut, loading, error };
}
