import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useNavigate } from 'react-router-dom';

export default function InteractionsHmisiew() {
  const asdf = useNavigate();
  console.log();
  console.log('| -------------  asdf  ------------- |');
  console.log(JSON.stringify(asdf, null, 2));
  console.log();
  const { noteId, arrivedFrom } = useLocalSearchParams<{
    noteId: string;
    arrivedFrom: string;
  }>();

  return (
    <View>
      <TextBold>VIEW NOTE</TextBold>
    </View>
  );
}
