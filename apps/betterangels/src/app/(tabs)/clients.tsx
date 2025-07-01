import { Clients, ClientsAddInteraction } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function ClientsScreen() {
  const { addInteraction } = useLocalSearchParams();

  if (addInteraction) {
    return <ClientsAddInteraction Logo={Logo} />;
  }

  return <Clients Logo={Logo} />;
}
