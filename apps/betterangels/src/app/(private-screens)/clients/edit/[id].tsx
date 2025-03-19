import { ClientProfileForms } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function EditClientScreen() {
  const { id, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!id || !componentName) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ClientProfileForms id={id} componentName={componentName} />;
}
