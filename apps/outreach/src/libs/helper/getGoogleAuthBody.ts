import { Platform } from 'react-native';

export default function getGoogleAuthBody(
  code: string,
  googleClientId: string | undefined,
  redirectUri: 'string'
) {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return `code=${code}&client_id=${googleClientId}&redirect_uri=${redirectUri}&grant_type=authorization_code`;
  } else {
    return `code=${code}&client_id=${googleClientId}&client_secret=${process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET}&redirect_uri=${redirectUri}&grant_type=authorization_code`;
  }
}
