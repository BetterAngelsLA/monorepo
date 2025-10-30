import { HmisProgramNoteView } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function InteractionsHmisiew() {
  const { id, personalId, enrollmentId } = useLocalSearchParams<{
    personalId: string;
    enrollmentId: string;
    id: string;
  }>();

  if (!id || !personalId || !enrollmentId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteView
      id={id}
      personalId={personalId}
      enrollmentId={enrollmentId}
    />
  );
}
