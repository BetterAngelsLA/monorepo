import { DocumentNode, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback } from 'react';
import useUser from './useUser';

export default function useSignIn(mutation: DocumentNode) {
  const [socialAuth, { loading, error }] = useMutation(mutation);
  const { setUser } = useUser();

  const signIn = useCallback(
    async (code: string, codeVerifier: string, redirectUri: string) => {
      try {
        const response = await socialAuth({
          variables: {
            code: code,
            codeVerifier: codeVerifier,
            redirectUri: encodeURIComponent(redirectUri),
          },
        });

        if (response.data) {
          const userData = response.data;
          // TODO: Maybe we should allow passing the userData mutation directly?
          setUser({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            hasOrganization: false,
          });
          // TODO: It may make sense to put this somewhere else?
          router.replace(userData.hasOrganization ? '/' : '/welcome');
        }
      } catch (error) {
        console.error(error);
      }
    },
    [socialAuth, setUser]
  );

  return { signIn, loading, error };
}
