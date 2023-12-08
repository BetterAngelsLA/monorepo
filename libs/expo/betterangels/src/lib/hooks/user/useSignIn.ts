import { DocumentNode, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import useUser from './useUser';

export default function useSignIn(mutation: DocumentNode) {
  const [socialAuth, { loading, error }] = useMutation(mutation);
  const { user, refetchUser: refetch } = useUser();

  const signIn = useCallback(
    async (code: string, codeVerifier: string, redirectUri: string) => {
      try {
        await socialAuth({
          variables: {
            code,
            codeVerifier,
            redirectUri: encodeURIComponent(redirectUri),
          },
        });
        refetch();
      } catch (error) {
        console.error('Error during sign in:', error);
      }
    },
    [socialAuth]
  );

  useEffect(() => {
    if (user) {
      router.replace(user.hasOrganization ? '/' : '/welcome');
    }
  }, [user]);

  return { signIn, loading, error };
}
