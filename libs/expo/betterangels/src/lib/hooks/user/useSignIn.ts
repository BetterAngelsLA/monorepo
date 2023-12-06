import { DocumentNode, useLazyQuery, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { GET_CURRENT_USER } from '../../helpers/fetchUser';
import useUser from './useUser';

export default function useSignIn(mutation: DocumentNode) {
  const [socialAuth, { loading, error }] = useMutation(mutation);
  const [
    getCurrentUser,
    { data: userData, loading: userIsLoading, error: userError },
  ] = useLazyQuery(GET_CURRENT_USER);
  const { setUser } = useUser();

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

        // Execute the getCurrentUser query after successful login
        getCurrentUser();
      } catch (error) {
        console.error('Error during sign in:', error);
      }
    },
    [socialAuth, getCurrentUser]
  );

  // Update the user state once the currentUser data is fetched
  useEffect(() => {
    if (userData && userData.currentUser) {
      setUser({
        id: userData.currentUser.id,
        email: userData.currentUser.email,
        username: userData.currentUser.username,
        hasOrganization: userData.currentUser.hasOrganization,
      });
      router.replace(userData.currentUser.hasOrganization ? '/' : '/welcome');
    }
  }, [userData, setUser]);

  return { signIn, loading, error, userIsLoading, userError };
}
