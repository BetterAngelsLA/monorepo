import { Task } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Task id={id} />;
}
