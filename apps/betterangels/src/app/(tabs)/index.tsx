import { Clients, ClientsAddInteraction } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function HomeScreen() {
  const { createInteraction } = useLocalSearchParams();

  if (createInteraction) {
    return <ClientsAddInteraction Logo={Logo} />;
  }

  return <Clients Logo={Logo} />;
}
