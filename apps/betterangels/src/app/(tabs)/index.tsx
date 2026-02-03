import {
  Clients,
  ClientsAddInteraction,
  ClientsAddNoteHmis,
  useUser,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function HomeScreen() {
  const { createInteraction } = useLocalSearchParams();
  const { isHmisUser } = useUser();

  if (createInteraction) {
    if (isHmisUser) {
      return <ClientsAddNoteHmis Logo={Logo} />;
    }

    return <ClientsAddInteraction Logo={Logo} />;
  }

  return <Clients Logo={Logo} />;
}
