import { Clients } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import Logo from '../assets/images/logo.svg';

export default function ClientsScreen() {
  const { title, select } = useLocalSearchParams();

  console.log();
  console.log('| -------------  ClientsScreen  ------------- |');
  console.log('*****************  title:', title);
  console.log('*****************  select:', select);
  console.log();

  return <Clients Logo={Logo} />;
}
