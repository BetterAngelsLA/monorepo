import { FindShelterPicker, useUser } from '@monorepo/expo/betterangels';
import { Redirect } from 'expo-router';

export default function FindShelterScreen() {
  const { user } = useUser();

  // The add-menu entry is hidden for HMIS sessions, whose client list and
  // profile are a different set entirely; a deep link must not reach the BA
  // list either.
  if (user?.isHmisUser) {
    return <Redirect href="/" />;
  }

  return <FindShelterPicker />;
}
