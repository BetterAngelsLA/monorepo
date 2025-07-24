import { Alert, Linking } from 'react-native';

type TProps = {
  title: string;
  message?: string;
  cancelLabel?: string;
  acceptLabel?: string;
};

export function showOpenSettingsAlert(props: TProps) {
  const {
    title,
    message,
    cancelLabel = 'Cancel',
    acceptLabel = 'Settings',
  } = props;

  Alert.alert(title, message, [
    {
      text: cancelLabel,
      style: 'cancel',
    },
    {
      text: acceptLabel,
      onPress: () => Linking.openSettings(),
    },
  ]);
}
