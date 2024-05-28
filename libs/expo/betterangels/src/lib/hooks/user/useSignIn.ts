import { DocumentNode, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import useUser from './useUser';

export default function useSignIn(mutation: DocumentNode) {
  const { user, refetchUser } = useUser();
  const [socialAuth, { loading, error }] = useMutation(mutation);

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
        refetchUser();
      } catch (err) {
        console.error('Error during sign in:', err);
      }
    },
    [socialAuth, refetchUser]
  );

  // NOTE: We may want to consider putting this routing elsewhere.
  useEffect(() => {
    if (user) {
      router.replace(user.hasOrganization ? '/' : '/welcome');
    }
  }, [user]);

  return { signIn, loading, error };
}
