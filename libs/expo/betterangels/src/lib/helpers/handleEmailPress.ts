import { Linking } from 'react-native';

export default function handleEmailPress(email: string): Promise<void> {
  const url = `mailto:${email}`;
  return Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        console.log(`Can't handle url: ${url}`);
        return Promise.reject(`Can't handle url: ${url}`);
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => {
      console.error('An error occurred', err);
      return Promise.reject(err);
    });
}
