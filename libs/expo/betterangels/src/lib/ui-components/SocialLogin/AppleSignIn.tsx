import { gql } from '@apollo/client';
import * as AppleAuthentication from 'expo-apple-authentication';
import { StyleSheet } from 'react-native';
import useSignIn from '../../hooks/user/useSignIn';

export const APPLE_AUTH_MUTATION = gql`
  mutation AppleAuth($idToken: String!) {
    appleAuth(input: { id_token: $idToken })
      @rest(
        type: "AuthResponse"
        path: "/rest-auth/apple/"
        method: "POST"
        bodyKey: "input"
      ) {
      status_code
    }
  }
`;

export function AppleSignIn() {
  const { signIn } = useSignIn(APPLE_AUTH_MUTATION);

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={50}
      style={styles.button}
      onPress={async () => {
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (credential?.identityToken != null) {
            await signIn({ idToken: credential?.identityToken });
          }
        } catch (e: unknown) {
          if (e instanceof Error && 'code' in e) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
              console.log('User canceled the sign-in process.');
            } else {
              console.error('An error occurred during sign-in:', e.message);
            }
          }
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%', // Adjust width to be flexible and consistent
    height: 44,
  },
});
