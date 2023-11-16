import { useUser } from '@monorepo/expo/betterangels';
import { Redirect, Slot } from 'expo-router';

export default function TeamLayout() {
  const { user } = useUser();

  if (!user) {
    return <Redirect href="/auth" />;
  }
  return <Slot />;
}
