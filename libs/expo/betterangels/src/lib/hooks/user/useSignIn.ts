import { DocumentNode, useMutation, useQuery } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { GET_CURRENT_USER } from '../../apollo/graphql';
import useUser from './useUser';

export default function useSignIn(mutation: DocumentNode) {
  const [socialAuth, { loading, error }] = useMutation(mutation);
  const {
    data: userData,
    loading: userIsLoading,
    error: userError,
    refetch: getCurrentUser,
  } = useQuery(GET_CURRENT_USER);
  const { setUser } = useUser();

  console.log('useSignIn fired', userData, userIsLoading, userError);

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
        console.log('getCurrentUser fired');
        getCurrentUser();
      } catch (error) {
        console.error('Error during sign in:', error);
      }
    },
    [socialAuth, getCurrentUser]
  );

  useEffect(() => {
    console.log('user data fired for use effect', userData);
    if (userData && userData.currentUser) {
      setUser(userData.currentUser);
      router.replace(userData.currentUser.hasOrganization ? '/' : '/welcome');
    }
  }, [userData, setUser]);

  return { signIn, loading, error, userIsLoading, userError };
}
