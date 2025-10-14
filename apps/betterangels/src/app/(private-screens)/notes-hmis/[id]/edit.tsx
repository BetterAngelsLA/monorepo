import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function InteractionsHmisEdit() {
  const { noteId, arrivedFrom } = useLocalSearchParams<{
    noteId: string;
    arrivedFrom: string;
  }>();

  return (
    <View>
      <TextBold>EDIT NOTE</TextBold>
    </View>
  );
}
