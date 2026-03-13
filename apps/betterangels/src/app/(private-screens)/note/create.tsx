import { NoteEditorScreen } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function NoteCreateRoute() {
  const { arrivedFrom, clientProfileId, team } = useLocalSearchParams<{
    arrivedFrom: string;
    clientProfileId: string;
    team: string;
  }>();

  return (
    <NoteEditorScreen
      mode="create"
      arrivedFrom={arrivedFrom}
      clientProfileId={clientProfileId}
      team={team}
    />
  );
}
