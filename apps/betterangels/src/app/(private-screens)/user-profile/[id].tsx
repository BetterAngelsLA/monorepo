import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
};

export default function UserProfileEdit() {
  const { id } = useLocalSearchParams<TSearchParams>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <UserProfileEdit id={id} />;
}
