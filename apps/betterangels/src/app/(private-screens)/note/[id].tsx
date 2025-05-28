import { Note } from '@monorepo/expo/betterangels';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

export default function NoteScreen() {
  const router = useRouter();
  const { id, arrivedFrom } = useLocalSearchParams<{
    id: string;
    arrivedFrom?: string;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Note display */}
      <Note id={id} arrivedFrom={arrivedFrom} />

      {/* Proof-of-Concept Modal Trigger */}
      <View style={{ padding: 16 }}>
        <Button
          title="Open Demo Modal"
          onPress={() => router.push('/base-modal-screen?type=SERVICES')}
          variant="primary"
          accessibilityHint="Opens the demo modal screen"
        />
      </View>
    </View>
  );
}
