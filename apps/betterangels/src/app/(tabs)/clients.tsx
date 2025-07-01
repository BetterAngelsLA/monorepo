import { Clients } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function ClientsScreen() {
  const { title, select } = useLocalSearchParams();

  return <Clients Logo={Logo} />;
}
