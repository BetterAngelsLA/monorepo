import { DocumentNode, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import useUser from './useUser';

interface SignInParams {
  code?: string;
  codeVerifier?: string;
  idToken?: string;
  redirectUri?: string;
}

export default function useSignIn(mutation: DocumentNode) {
  const { user, refetchUser } = useUser();
  const [socialAuth, { loading, error }] = useMutation(mutation);

  const signIn = useCallback(
    async ({ code, codeVerifier, redirectUri, idToken }: SignInParams) => {
      try {
        await socialAuth({
          variables: {
            code,
            codeVerifier,
            idToken,
            redirectUri: redirectUri
              ? encodeURIComponent(redirectUri)
              : undefined,
          },
        });
        await refetchUser();
      } catch (err) {
        console.error('Error during sign in:', err);
      }
    },
    [socialAuth, refetchUser]
  );

  useEffect(() => {
    if (user) {
      router.replace(user.isOutreachAuthorized ? '/' : '/welcome');
    }
  }, [user]);

  return { signIn, loading, error };
}
